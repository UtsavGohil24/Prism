"""
Multi-model LLM client for Prism.

Selectable primary models (user picks one on the landing page):
  - "gemini" (default): Gemini 2.5 Flash, native SDK, strict
    response_schema structured output.
  - "nemotron": NVIDIA Nemotron via OpenRouter's free tier.
  - "glm": GLM via OpenRouter's free tier.

("qwen" is accepted as an alias for "nemotron" for older frontends.)

Groq is NEVER user-selectable. It's the shared fallback behind all three
primaries.

A fallback to Groq happens when the primary model:
  - errors (rate limit, overload, model retired from the free tier), OR
  - returns output that fails the caller's validation (malformed JSON,
    missing files, etc.).
A missing API key is a config problem and is surfaced directly instead.

Only Gemini gets the schema as a hard API-level constraint. For every other
model the JSON Schema is appended to the system prompt, otherwise they guess
the field names.
"""

import os
import json
import time
import logging

from google import genai
from google.genai import types
from google.genai.errors import APIError as GeminiAPIError

logger = logging.getLogger("prism.llm_client")

GEMINI_MODEL = "gemini-2.5-flash"
NEMOTRON_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"
GLM_MODEL = "z-ai/glm-5.2:free"
GROQ_MODEL = "openai/gpt-oss-120b"

# Maps the user-facing key -> the model label stored in reports.model_used
MODEL_LABELS = {
    "gemini": GEMINI_MODEL,
    "nemotron": NEMOTRON_MODEL,
    "glm": GLM_MODEL,
}
MODEL_ALIASES = {"qwen": "nemotron"}

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 1.5  # 1.5s, 3s, 6s

# Codes worth retrying the SAME model for (genuinely transient load issues)
RETRYABLE_HTTP_CODES = {429, 500, 502, 503}


class LLMUnavailableError(Exception):
    """Raised when the requested model AND the fallback both fail."""


class LLMConfigError(Exception):
    """Raised when a required API key for the requested model is missing."""


class _EmptyCompletion(Exception):
    """OpenRouter returned HTTP 200 with an error body / no choices.
    Usually a transient upstream problem on the free tier, so it is retried."""


# ---- helpers ---------------------------------------------------------------

def strip_json_fences(text: str) -> str:
    """
    Cleans typical non-Gemini output: markdown fences and any text before the
    first '{' or after the last '}'.
    """
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        text = text[start:end + 1]
    return text.strip()


def _with_schema(system_instruction: str, response_schema) -> str:
    """Appends the JSON Schema so non-Gemini models use the exact field names."""
    schema = json.dumps(response_schema.model_json_schema(), indent=2)
    return (
        system_instruction
        + "\n\nCRITICAL: Respond with ONE raw JSON object and nothing else "
        "(no markdown fences, no explanation). It must validate against this "
        "JSON Schema and use exactly these field names:\n"
        + schema
    )


def _with_retries(call_fn, is_retryable_fn, label: str) -> str:
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return call_fn()
        except Exception as e:
            if is_retryable_fn(e):
                last_error = e
                wait = BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
                logger.warning(
                    f"[{label}] retryable error on attempt {attempt}/{MAX_RETRIES}: "
                    f"{type(e).__name__}: {e}. Retrying in {wait:.1f}s..."
                )
                time.sleep(wait)
            else:
                # Non-retryable for THIS model (e.g. model retired, bad request).
                logger.warning(f"[{label}] non-retryable error, will fall back: {type(e).__name__}: {e}")
                raise LLMUnavailableError(f"{label} unavailable: {e}") from e
    raise LLMUnavailableError(f"{label} failed after {MAX_RETRIES} attempts: {last_error}")


# ---- Gemini ----------------------------------------------------------------

def _call_gemini(contents: str, system_instruction: str, response_schema) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise LLMConfigError("GEMINI_API_KEY is missing.")

    client = genai.Client(api_key=api_key)

    def do_call():
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0.0,
                max_output_tokens=16384,
            ),
        )
        if not response or not response.text:
            raise ValueError("Empty response from Gemini")
        return response.text

    def is_retryable(e):
        return isinstance(e, GeminiAPIError) and e.code in RETRYABLE_HTTP_CODES

    return _with_retries(do_call, is_retryable, "Gemini")


# ---- OpenRouter (shared helper for Nemotron + GLM) --------------------------

def _call_openrouter(model_id: str, contents: str, system_instruction: str, label: str) -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise LLMConfigError("OPENROUTER_API_KEY is missing.")

    from openai import OpenAI, RateLimitError, APIStatusError

    client = OpenAI(api_key=api_key, base_url=OPENROUTER_BASE_URL)

    def do_call():
        completion = client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": contents},
            ],
            temperature=0.2,
        )
        # OpenRouter free models often return 200 with an error body and
        # choices=None instead of raising. Detect that and retry.
        if not getattr(completion, "choices", None):
            detail = getattr(completion, "model_extra", None) or completion
            raise _EmptyCompletion(f"no choices returned: {detail}")
        content = completion.choices[0].message.content
        if not content:
            raise _EmptyCompletion("empty content returned")
        return strip_json_fences(content)

    def is_retryable(e):
        if isinstance(e, (RateLimitError, _EmptyCompletion)):
            return True
        return isinstance(e, APIStatusError) and e.status_code in RETRYABLE_HTTP_CODES
        # A 404 "model retired from free tier" is NOT retryable: it becomes
        # LLMUnavailableError so the caller falls back to Groq right away.

    return _with_retries(do_call, is_retryable, label)


def _call_nemotron(contents: str, system_instruction: str) -> str:
    return _call_openrouter(NEMOTRON_MODEL, contents, system_instruction, "Nemotron")


def _call_glm(contents: str, system_instruction: str) -> str:
    return _call_openrouter(GLM_MODEL, contents, system_instruction, "GLM")


# ---- Groq (fallback only, never user-selectable) ----------------------------

def _call_groq(contents: str, system_instruction: str) -> str:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise LLMConfigError("GROQ_API_KEY is missing, fallback unavailable.")

    from openai import OpenAI, RateLimitError, APIStatusError  # Groq is OpenAI-compatible

    client = OpenAI(api_key=api_key, base_url=GROQ_BASE_URL)

    def do_call():
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": contents},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        if not getattr(completion, "choices", None):
            raise _EmptyCompletion("Groq returned no choices")
        content = completion.choices[0].message.content
        if not content:
            raise _EmptyCompletion("Groq returned empty content")
        return strip_json_fences(content)

    def is_retryable(e):
        if isinstance(e, (RateLimitError, _EmptyCompletion)):
            return True
        return isinstance(e, APIStatusError) and e.status_code in RETRYABLE_HTTP_CODES

    return _with_retries(do_call, is_retryable, "Groq")


# ---- Public entry point ------------------------------------------------------

def generate_analysis_with_fallback(contents: str, system_instruction: str,
                                    response_schema,
                                    requested_model: str = "gemini",
                                    validate_fn=None) -> tuple[str, str]:
    """
    Returns (raw_json_text, model_used).

    requested_model: "gemini" | "nemotron" | "glm" (the user's pick).
    validate_fn: optional callable(text) that raises ValueError if the output
        is unusable (bad JSON, missing files...). A failed validation counts
        as a primary-model failure and triggers the Groq fallback. If the
        fallback output also fails validation, LLMUnavailableError is raised.
    """
    requested_model = MODEL_ALIASES.get(requested_model, requested_model)

    # Non-Gemini models need the schema spelled out in the prompt.
    schema_instruction = _with_schema(system_instruction, response_schema)

    dispatch = {
        "gemini": lambda: _call_gemini(contents, system_instruction, response_schema),
        "nemotron": lambda: _call_nemotron(contents, schema_instruction),
        "glm": lambda: _call_glm(contents, schema_instruction),
    }

    if requested_model not in dispatch:
        raise ValueError(f"Unknown model requested: {requested_model}")

    model_label = MODEL_LABELS[requested_model]

    try:
        text = dispatch[requested_model]()
        if validate_fn:
            validate_fn(text)
        return text, model_label

    except LLMConfigError:
        raise  # missing key: surface directly, don't mask with a fallback

    except Exception as e:
        logger.warning(f"{model_label} failed, falling back to Groq. Reason: {type(e).__name__}: {e}")
        try:
            text = _call_groq(contents, schema_instruction)
            if validate_fn:
                validate_fn(text)
            return text, f"{GROQ_MODEL} (fallback from {model_label})"
        except LLMConfigError:
            raise
        except Exception as fallback_error:
            logger.error(f"Groq fallback also failed: {type(fallback_error).__name__}: {fallback_error}")
            raise LLMUnavailableError(
                f"Both {model_label} and the Groq fallback failed. "
                f"{model_label}: {e} | Groq: {fallback_error}"
            )