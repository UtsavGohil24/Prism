import os
import re
import json
import uuid
from datetime import datetime, timezone
from google import genai
from google.genai import types
from fastapi import HTTPException
from models.schemas import AnalysisResponse
from dotenv import load_dotenv

load_dotenv()


def extract_filenames(raw_diff: str) -> list[str]:
    """
    Pulls every filename touched by the diff, in order, by matching
    'diff --git a/path b/path' header lines. Uses the post-change (b/) path.
    """
    matches = re.findall(r'^diff --git a/(.+?) b/(.+?)$', raw_diff, re.MULTILINE)
    return [m[1] for m in matches]


def analyze_code_diff(raw_diff: str, pr_url: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API Key missing. Ensure GEMINI_API_KEY is defined in your .env file."
        )

    client = genai.Client(api_key=api_key)

    filenames = extract_filenames(raw_diff)
    expected_file_count = len(filenames)
    print(f"[DEBUG] Files detected in diff: {expected_file_count} — {filenames}")

    system_instruction = (
        "You are an expert Senior Security Engineer. Analyze the provided git patch/diff text. "
        "The diff may contain multiple files, each starting with a line beginning 'diff --git'. "
        "You MUST include exactly one entry in the `files` array for every single file present in the diff — "
        "do not skip, merge, summarize together, or omit any file, even if its changes seem trivial, "
        "auto-generated, or low-risk. Under-reporting the file count is a critical failure. "
        "You must output your findings strictly matching the requested JSON schema layout. "
        "risk_level and confidence values must be lowercase: 'low', 'medium', or 'high'. "
        "Evaluate every file changed, count the bugs found, provide constructive suggestions, "
        "and calculate an overall risk score from 0 to 100 based on the severity of the findings. "
        "Provide a clear merge recommendation. Leave metadata fields like pr_title, author, and report_id "
        "as blank strings; they will be populated by the application layer."
    )

    # Explicitly hand Gemini the filename list and a hard count requirement,
    # rather than relying on it to enumerate the diff correctly on its own.
    if expected_file_count > 0:
        file_list_str = "\n".join(f"- {f}" for f in filenames)
        contents = (
            f"This diff contains exactly {expected_file_count} file(s):\n{file_list_str}\n\n"
            f"Your `files` array in the response MUST contain exactly {expected_file_count} entries, "
            f"one per filename listed above — no more, no fewer.\n\n"
            f"Analyze this raw git patch text:\n\n{raw_diff}"
        )
    else:
        # Fallback: couldn't parse any file headers ourselves, let Gemini try anyway
        contents = f"Analyze this raw git patch text:\n\n{raw_diff}"

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=AnalysisResponse,
                temperature=0.2,
                max_output_tokens=8192,
            ),
        )

        try:
            analysis_data = json.loads(response.text)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned malformed or truncated JSON — the diff may be too large. Consider chunking."
            )

        # --- Consistency check: did Gemini actually cover every file? ---
        actual_file_count = len(analysis_data.get("files", []))
        if expected_file_count > 0 and actual_file_count < expected_file_count:
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Gemini analyzed {actual_file_count}/{expected_file_count} files in the diff — "
                    f"incomplete analysis. Expected files: {filenames}"
                )
            )

        # --- Recompute summary programmatically (don't trust Gemini's counts) ---
        files = analysis_data.get("files", [])
        analysis_data["summary"] = {
            "total_files": len(files),
            "high_risk_files": sum(1 for f in files if f.get("risk_level", "").lower() == "high"),
            "medium_risk_files": sum(1 for f in files if f.get("risk_level", "").lower() == "medium"),
            "low_risk_files": sum(1 for f in files if f.get("risk_level", "").lower() == "low"),
            "total_bugs": sum(len(f.get("bugs", [])) for f in files),
        }

        # --- Dynamic Post-Processing Meta Injection ---
        analysis_data["pr_url"] = pr_url
        analysis_data["report_id"] = f"REP-{uuid.uuid4().hex[:8].upper()}"
        analysis_data["created_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        if not analysis_data.get("pr_title") or analysis_data["pr_title"] == "":
            analysis_data["pr_title"] = "Pull Request Optimization Review"
        if not analysis_data.get("author") or analysis_data["author"] == "":
            analysis_data["author"] = "GitHub Contributor"

        return analysis_data

    except HTTPException:
        raise  # let deliberately-raised HTTPExceptions (502, etc.) bubble up untouched
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini Analysis Execution Failed: {str(e)}"
        )