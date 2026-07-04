import re
import requests
from fastapi import HTTPException


def parse_pr_url(pr_url: str) -> str:
    
    pr_url = pr_url.rstrip('/')

    pattern = r"https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)"
    match = re.match(pattern, pr_url)

    if not match:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub Pull Request URL format."
        )

    owner, repo, pull_number = match.groups()
    return f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}"


def fetch_pr_diff(pr_url: str, github_token: str = None) -> str:

    # 1. Parse the URL to get the target API endpoint
    api_url = parse_pr_url(pr_url)

    headers = {
        "User-Agent": "PR-Risk-Analyzer/1.0",
        # This Accept header tells the GitHub API to return raw diff text
        # instead of the default JSON PR metadata.
        "Accept": "application/vnd.github.v3.diff",
    }

    # Add token authorization if it's a private repo or to avoid rate limiting
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    try:
        response = requests.get(api_url, headers=headers, timeout=60)

        # Visibility into rate limit status
        rate_limit_remaining = response.headers.get("X-RateLimit-Remaining")
        rate_limit_limit = response.headers.get("X-RateLimit-Limit")
        print(f"[DEBUG] Rate limit: {rate_limit_remaining}/{rate_limit_limit}")

        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository or Pull Request not found.")
        elif response.status_code == 403 and "rate limit" in response.text.lower():
            raise HTTPException(
                status_code=429,
                detail="GitHub API rate limit exceeded. Add or check your GITHUB_TOKEN to increase your limit."
            )
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch diff from GitHub.")

        content_type = response.headers.get("Content-Type", "")
        if "text/html" in content_type:
            raise HTTPException(
                status_code=502,
                detail="GitHub returned an unexpected HTML page instead of patch data. The PR may not exist or may be inaccessible."
            )

        # Ensure correct decoding for diff text (avoids mangling on unusual encodings)
        response.encoding = response.encoding or "utf-8"

        # Return the raw text diff
        return response.text

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error connecting to GitHub: {str(e)}")