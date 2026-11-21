import os
import json
import time
import re

from dotenv import load_dotenv

load_dotenv()

# --------------------------------------------------
# MODEL CONFIGURATION
# --------------------------------------------------

GEMINI_MODEL = "gemini-2.5-flash"
COHERE_MODEL = "command-a-plus-05-2026"
CLOUDFLARE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
GROQ_MODEL = "openai/gpt-oss-120b"

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

MODEL_LABELS = {
    "gemini": "Gemini 2.5 Flash",
    "cohere": "Cohere Command A+",
    "llama": "Llama 3.3 70B (Cloudflare)",
}

MODEL_ALIASES = {}

RETRY_ATTEMPTS = 3
RETRY_DELAY = 1.5
RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}


# --------------------------------------------------
# ERRORS
# --------------------------------------------------

class LLMUnavailableError(Exception):
    pass


class LLMConfigError(Exception):
    pass


# --------------------------------------------------
# JSON HELPERS
# --------------------------------------------------

def strip_json_fences(text: str) -> str:
    text = text.strip()

    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(r"\s*```$", "", text)

    return text.strip()


def _schema_to_json_schema(response_schema):
    if hasattr(response_schema, "model_json_schema"):
        return response_schema.model_json_schema()

    if hasattr(response_schema, "schema"):
        return response_schema.schema()

    if isinstance(response_schema, dict):
        return response_schema

    return None


def _with_retries(fn):
    last_error = None

    for attempt in range(RETRY_ATTEMPTS):
        try:
            return fn()

        except Exception as e:
            last_error = e

            status = getattr(e, "status_code", None)

            response = getattr(e, "response", None)
            if status is None and response is not None:
                status = getattr(response, "status_code", None)

            if status is not None:
                try:
                    status = int(status)
                except (TypeError, ValueError):
                    status = None

            if status not in RETRYABLE_STATUS_CODES:
                raise LLMUnavailableError(str(e)) from e

            if attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_DELAY * (2 ** attempt))

    raise LLMUnavailableError(str(last_error)) from last_error


def _validate_output(text, validate_fn=None):
    cleaned = strip_json_fences(text)

    try:
        json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response: {e}") from e

    if validate_fn:
        validate_fn(cleaned)

    return cleaned


# --------------------------------------------------
# GEMINI
# --------------------------------------------------

def _generate_gemini(
    contents,
    system_instruction,
    response_schema
):
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise LLMConfigError("GEMINI_API_KEY is missing.")

    client = genai.Client(api_key=api_key)

    schema = _schema_to_json_schema(response_schema)

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type="application/json",
        response_schema=schema,
        temperature=0,
    )

    def request():
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=config,
        )

        if not response.text:
            raise ValueError("Gemini returned an empty response.")

        return response.text

    return _with_retries(request)


# --------------------------------------------------
# COHERE
# --------------------------------------------------

def _generate_cohere(
    contents,
    system_instruction,
    response_schema
):
    import cohere

    api_key = os.getenv("COHERE_API_KEY")

    if not api_key:
        raise LLMConfigError("COHERE_API_KEY is missing.")

    client = cohere.ClientV2(api_key=api_key)

    schema = _schema_to_json_schema(response_schema)

    response_format = {"type": "json_object"}

    if schema:
        response_format["schema"] = schema

    def request():
        response = client.chat(
            model=COHERE_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_instruction,
                },
                {
                    "role": "user",
                    "content": contents,
                },
            ],
            response_format=response_format,
            temperature=0,
        )

        response_content = response.message.content or []

        text = next(
            (
                item.text
                for item in response_content
                if getattr(item, "text", None)
            ),
            None,
        )

        if not text:
            raise ValueError("Cohere returned an empty response.")

        return text

    return _with_retries(request)


# --------------------------------------------------
# OPENAI-COMPATIBLE PROVIDERS
# --------------------------------------------------

def _generate_openai_compatible(
    api_key,
    base_url,
    model,
    contents,
    system_instruction,
    response_schema,
):
    from openai import OpenAI

    client = OpenAI(
        api_key=api_key,
        base_url=base_url,
        timeout=90,
        max_retries=0,
    )

    schema = _schema_to_json_schema(response_schema)

    system_prompt = system_instruction

    if schema:
        system_prompt += (
            "\n\nReturn valid JSON matching this schema:\n"
            + json.dumps(schema)
        )

    def request():
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": contents,
                },
            ],
            temperature=0,
            max_tokens=8192,
            response_format={"type": "json_object"},
        )

        text = response.choices[0].message.content
        # TEMPORARY DEBUG LOGS
        print("[DEBUG] Provider:", model)
        print("[DEBUG] Finish reason:", response.choices[0].finish_reason)
        print("[DEBUG] Response length:", len(text or ""))
        print("[DEBUG] Response ending:", repr((text or "")[-300:]))

        if not text:
            raise ValueError(f"{model} returned an empty response.")

        return text

    return _with_retries(request)


# --------------------------------------------------
# CLOUDFLARE LLAMA
# --------------------------------------------------

def _generate_llama(
    contents,
    system_instruction,
    response_schema
):
    api_token = os.getenv("CLOUDFLARE_API_TOKEN")
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")

    if not api_token:
        raise LLMConfigError("CLOUDFLARE_API_TOKEN is missing.")

    if not account_id:
        raise LLMConfigError("CLOUDFLARE_ACCOUNT_ID is missing.")

    base_url = (
        f"https://api.cloudflare.com/client/v4/accounts/"
        f"{account_id}/ai/v1"
    )

    return _generate_openai_compatible(
        api_key=api_token,
        base_url=base_url,
        model=CLOUDFLARE_MODEL,
        contents=contents,
        system_instruction=system_instruction,
        response_schema=response_schema,
    )


# --------------------------------------------------
# GROQ FALLBACK
# --------------------------------------------------

def _generate_groq(
    contents,
    system_instruction,
    response_schema
):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise LLMConfigError(
            "GROQ_API_KEY is missing. Automatic fallback is unavailable."
        )

    return _generate_openai_compatible(
        api_key=api_key,
        base_url=GROQ_BASE_URL,
        model=GROQ_MODEL,
        contents=contents,
        system_instruction=system_instruction,
        response_schema=response_schema,
    )


# --------------------------------------------------
# PUBLIC ENTRY POINT
# --------------------------------------------------

def generate_analysis_with_fallback(
    contents: str,
    system_instruction: str,
    response_schema,
    requested_model: str = "gemini",
    validate_fn=None,
) -> tuple[str, str]:

    model = MODEL_ALIASES.get(requested_model, requested_model)

    if model not in MODEL_LABELS:
        raise LLMConfigError(
            f"Unsupported model: {requested_model}"
        )

    providers = {
        "gemini": _generate_gemini,
        "cohere": _generate_cohere,
        "llama": _generate_llama,
    }

    primary = providers[model]

    try:
        raw_text = primary(
            contents,
            system_instruction,
            response_schema,
        )

        cleaned = _validate_output(raw_text, validate_fn)

        return cleaned, MODEL_LABELS[model]

    except LLMConfigError:
        raise

    except Exception as primary_error:
        print(
            f"[LLM FALLBACK] {MODEL_LABELS[model]} failed: "
            f"{type(primary_error).__name__}: {primary_error}"
        )

        try:
            fallback_text = _generate_groq(
                contents,
                system_instruction,
                response_schema,
            )

            cleaned = _validate_output(fallback_text, validate_fn)

            return (
                cleaned,
                f"Groq GPT-OSS 120B (fallback from {MODEL_LABELS[model]})",
            )

        except Exception as fallback_error:
            raise LLMUnavailableError(
                f"Primary model failed ({primary_error}); "
                f"Groq fallback also failed ({fallback_error})"
            ) from fallback_error
