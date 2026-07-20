import os
import re
import json
import hashlib
import uuid
from datetime import datetime, timezone
from services.llm_client import generate_analysis_with_fallback
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

def extract_repo(pr_url: str) -> str:
    match = re.search(r'github\.com/([^/]+/[^/]+)/pull/\d+', pr_url)
    return match.group(1) if match else "unknown"

def compute_diff_hash(raw_diff: str) -> str:
    """
    Produces a deterministic fingerprint of the diff content.
    Same diff text -> same hash, always. Used to detect whether
    a PR has already been analyzed with this exact content.
    """
    return hashlib.sha256(raw_diff.encode("utf-8")).hexdigest()

SEVERITY_WEIGHTS = {"critical": 30, "moderate": 12, "minor": 4}
RISK_LEVEL_WEIGHTS = {"high": 10, "medium": 3, "low": 0}

def compute_risk_score(files: list[dict]) -> int:
    total_files = len(files)
    if total_files == 0:
        return 0

    all_bugs = [(f, bug) for f in files for bug in f.get("bugs", [])]

    if not all_bugs:
        # No bugs found — score purely from file risk_level, capped low
        high_risk = sum(1 for f in files if f.get("risk_level") == "high")
        medium_risk = sum(1 for f in files if f.get("risk_level") == "medium")
        return min(15, high_risk * 8 + medium_risk * 3)

    severities = [bug.get("severity", "minor") for _, bug in all_bugs]
    affected_files = len(set(f["filename"] for f, _ in all_bugs))
    affected_ratio = affected_files / total_files

    if "critical" in severities:
        low, high = 65, 100
    elif "moderate" in severities:
        low, high = 30, 65
    else:
        low, high = 10, 30

    score = low + (high - low) * affected_ratio

    return round(min(score, 100))

def analyze_code_diff(raw_diff: str, pr_url: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API Key missing. Ensure GEMINI_API_KEY is defined in your .env file."
        )

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
    "\n\n"
    "OUTPUT SHAPE FOR BUGS — each entry in a file's `bugs` array MUST be a JSON object "
    "with exactly these fields: {\"description\": string, \"severity\": \"minor\"|\"moderate\"|\"critical\", "
    "\"line_reference\": string or null}. Do NOT return bugs as plain strings.\n"
    "\n\n"
    "RISK CALIBRATION — use this scale strictly, most files should NOT be high:\n"
    "- 'low': typos, comments, formatting, minor refactors, test files, non-security config, "
    "logging changes, variable renames, small UI tweaks.\n"
    "- 'medium': logic changes that could introduce bugs but aren't security-critical, "
    "missing error handling, moderate complexity changes, changes to non-critical business logic.\n"
    "- 'high': RESERVE ONLY for actual security vulnerabilities (auth bypass, injection, secrets "
    "exposure, unsafe deserialization), data loss risk, or breaking changes to critical/production paths. "
    "Do not assign 'high' just because a file is important — the actual change must introduce real risk.\n"
    "\n"
    "Evaluate every file changed, count the bugs found, provide constructive suggestions, "
    "and calculate an overall risk score from 0 to 100 based on the severity of the findings — "
    "most well-written PRs should score well below 50. "
    "The merge_recommendation field MUST be a complete, natural-sounding sentence explaining "
    "whether the PR should be merged and why — for example: 'Safe to merge; changes are minor "
    "and low-risk.' or 'Review carefully before merging due to potential security concerns in "
    "auth/login.py.' Never return a single word like 'Approve' or 'Recommend' on its own. "
    "Leave metadata fields like pr_title, author, and report_id "
    "as blank strings; they will be populated by the application layer."
    "\n\n"
    "BUG SEVERITY — each bug MUST include a severity, calibrated as follows:\n"
    "- 'critical': security vulnerabilities, data corruption/loss risk, crashes, "
    "or logic errors that break core functionality for most/all users.\n"
    "- 'moderate': logic errors that affect specific edge cases, incorrect behavior "
    "under certain conditions, missing error handling that could cause failures.\n"
    "- 'minor': style inconsistencies, small inefficiencies, edge cases with low "
    "real-world impact, or issues that don't affect correctness but could be improved.\n"
    "Do not mark every bug as 'critical' — most bugs found in a typical PR are "
    "'minor' or 'moderate'. Reserve 'critical' for genuinely serious issues.\n"
    "\n"
    "LINE REFERENCE — for each bug, if you can identify the specific line number "
    "or function name where the issue occurs, include it in `line_reference` "
    "(e.g. 'line 42' or 'function setPrototypeKey'). If the issue is architectural "
    "or spans multiple locations without one specific line, leave `line_reference` as null.\n"
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
        raw_text, fallback_used = generate_analysis_with_fallback(
            api_key=api_key,
            contents=contents,
            system_instruction=system_instruction,
            response_schema=AnalysisResponse,
        )

        try:
            analysis_data = json.loads(raw_text)
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

        # --- Recompute summary programmatically 
        files = analysis_data.get("files", [])
        analysis_data["summary"] = {
            "total_files": len(files),
            "high_risk_files": sum(1 for f in files if f.get("risk_level", "").lower() == "high"),
            "medium_risk_files": sum(1 for f in files if f.get("risk_level", "").lower() == "medium"),
            "low_risk_files": sum(1 for f in files if f.get("risk_level", "").lower() == "low"),
            "total_bugs": sum(len(f.get("bugs", [])) for f in files),
        }

        # --- Recompute overall_risk_score programmatically
        analysis_data["overall_risk_score"] = compute_risk_score(files)

        # --- Dynamic Post-Processing Meta Injection ---
        analysis_data["pr_url"] = pr_url
        analysis_data["report_id"] = f"REP-{uuid.uuid4().hex[:8].upper()}"
        analysis_data["created_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        analysis_data["fallback_used"] = fallback_used
        analysis_data["repo"] = extract_repo(pr_url)

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