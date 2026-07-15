"""
1. Try Gemini 2.5 Flash (primary) with exponential backoff retries on
   transient errors (429 rate limit, 503 overloaded).
2. If Gemini keeps failing after retries, fall back to a secondary model
   (Groq/Llama by default here).
3. Both paths return the SAME normalized shape so the rest of our
   pipeline (parsing, Supabase save_report, etc.) doesn't need to care
   which model actually produced the result.
"""

import os
import time
import logging
 
from google import genai
from google.genai import types
from google.genai.errors import APIError
 
logger = logging.getLogger("prism.llm_client")
 
GEMINI_MODEL = "gemini-2.5-flash"
MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 1.5  # 1.5s, 3s, 6s
 
# Status codes worth retrying / falling back on
TRANSIENT_CODES = {429, 503}
 
 
class LLMUnavailableError(Exception):
    """Raised when both Gemini and the fallback model fail."""
 
 
def _call_gemini(client: genai.Client, contents: str, system_instruction: str,
                  response_schema) -> str:
    last_error = None
 
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=0.2,
                    max_output_tokens=8192,
                ),
            )
            if not response or not response.text:
                raise ValueError("Empty response from Gemini")
            return response.text
 
        except APIError as e:
            if e.code in TRANSIENT_CODES:
                last_error = e
                wait = BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
                logger.warning(
                    f"[Gemini] transient error {e.code} on attempt "
                    f"{attempt}/{MAX_RETRIES}. Retrying in {wait:.1f}s..."
                )
                time.sleep(wait)
            else:
                # Non-transient (e.g. 400 bad request, 401 auth) — don't retry
                logger.error(f"[Gemini] non-retryable error {e.code}: {e}")
                raise
 
    raise LLMUnavailableError(f"Gemini failed after {MAX_RETRIES} attempts: {last_error}")
 
 
def _call_fallback_groq(contents: str, system_instruction: str) -> str:
    """
    Groq fallback. Asks for the same JSON contract via prompt instructions
    plus JSON mode, since Groq doesn't support Gemini's response_schema.
    """
    from openai import OpenAI
 
    client = OpenAI(
        api_key=os.environ.get("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1",
    )
 
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": contents},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    return completion.choices[0].message.content
 
 
def generate_analysis_with_fallback(api_key: str, contents: str,
                                     system_instruction: str,
                                     response_schema) -> tuple[str, bool]:
    """
    Drop-in replacement for the client.models.generate_content(...) call
    inside analyze_code_diff. Returns (raw_json_text, fallback_used).
    """
    client = genai.Client(api_key=api_key)
 
    try:
        text = _call_gemini(client, contents, system_instruction, response_schema)
        return text, False
 
    except LLMUnavailableError as e:
        logger.warning(f"Falling back to Groq. Reason: {e}")
        try:
            text = _call_fallback_groq(contents, system_instruction)
            return text, True
        except Exception as fallback_error:
            logger.error(f"Groq fallback also failed: {fallback_error}")
            raise LLMUnavailableError(
                f"Both Gemini and Groq fallback failed. "
                f"Gemini: {e} | Groq: {fallback_error}"
            )