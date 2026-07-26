import os
from supabase import create_client
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

_sb_client = None

def get_client():
    """
    Lazily creates the Supabase client so import-time failures (e.g. missing
    env vars during local dev without Supabase configured yet) don't crash
    the whole app — only requests that actually need the DB will fail.
    """
    global _sb_client
    if _sb_client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise HTTPException(
                status_code=500,
                detail="Supabase credentials missing. Ensure SUPABASE_URL and SUPABASE_KEY are set in your .env file."
            )
        _sb_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _sb_client

def save_report(analysis_data: dict) -> dict:
    """
    Persists a completed analysis report to Supabase.
    """
    sb = get_client()

    try:
        sb.table("reports").insert({
            "report_id": analysis_data["report_id"],
            "pr_url": analysis_data["pr_url"],
            "repo": analysis_data["repo"], 
            "diff_hash": analysis_data["diff_hash"],
            "pr_title": analysis_data["pr_title"],
            "author": analysis_data["author"],
            "created_at": analysis_data["created_at"],
            "risk_score": analysis_data["overall_risk_score"],
            "confidence": analysis_data["confidence"],
            "recommendation": analysis_data["merge_recommendation"],
            "summary": analysis_data["summary"],
            "files": analysis_data["files"],
            "risk_factors": analysis_data["risk_factors"],
        }).execute()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save report to database: {str(e)}"
        )

    return analysis_data

def get_report(report_id: str) -> dict:
    """
    Fetches a previously saved report by its report_id and reshapes it
    back into the AnalysisResponse shape.
    """
    sb = get_client()

    try:
        result = sb.table("reports").select("*").eq("report_id", report_id).execute()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch report from database: {str(e)}"
        )

    if not result.data:
        raise HTTPException(status_code=404, detail="Report not found.")

    row = result.data[0]

    return {
        "report_id": row["report_id"],
        "pr_url": row["pr_url"],
        "repo": row["repo"],
        "pr_title": row["pr_title"],
        "author": row["author"],
        "created_at": row["created_at"],
        "overall_risk_score": row["risk_score"],
        "confidence": row["confidence"],
        "merge_recommendation": row["recommendation"],
        "summary": row["summary"],
        "files": row["files"],
        "risk_factors": row.get("risk_factors") or [],
    }

def get_repo_risk_scores(repo: str, exclude_report_id: str) -> list[int]:

    sb = get_client()

    try:
        result = sb.table("reports").select("risk_score, report_id").eq("repo", repo).execute()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch repo history from database: {str(e)}"
        )

    return [
        row["risk_score"]
        for row in result.data
        if row["report_id"] != exclude_report_id
    ]

def find_cached_report(pr_url: str, diff_hash: str) -> dict | None:
    """
    Checks if a report already exists for this exact PR URL + diff content.
    Returns the cached report if found, otherwise None.
    """
    sb = get_client()

    try:
        result = (
            sb.table("reports")
            .select("*")
            .eq("pr_url", pr_url)
            .eq("diff_hash", diff_hash)
            .limit(1)
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check cache in database: {str(e)}"
        )

    if not result.data:
        return None

    row = result.data[0]

    return {
        "report_id": row["report_id"],
        "pr_url": row["pr_url"],
        "repo": row["repo"],
        "pr_title": row["pr_title"],
        "author": row["author"],
        "created_at": row["created_at"],
        "overall_risk_score": row["risk_score"],
        "confidence": row["confidence"],
        "merge_recommendation": row["recommendation"],
        "summary": row["summary"],
        "files": row["files"],
        "risk_factors": row.get("risk_factors") or [],
    }


def list_reports(limit: int = 20) -> list[dict]:
    """
    Fetches a list of historical analysis reports, sorted by creation date descending.
    """
    sb = get_client()

    try:
        result = (
            sb.table("reports")
            .select("report_id, pr_title, pr_url, author, created_at, confidence, risk_score")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch reports list from database: {str(e)}"
        )

    return result.data
