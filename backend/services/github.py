import re  
import requests
from fastapi import HTTPException

def parse_github_url(url: str) -> str:

    # Regex to cleanly match and extract URL parameters
    #([^\/]+) means: "Grab all the letters until you hit a forward slash /
    #(\d+) means: "Grab the digits at the very end.
    url = url.rstrip('/')

    pattern = r"https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)"
    match = re.match(pattern,url)

    if not match:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub Pull Request URL format."
        )
    
    owner, repo, pull_number = match.groups()
    return f"https://github.com/{owner}/{repo}/pull/{pull_number}.patch"

def fetch_pr_diff(url: str, github_token: str = None) -> str:
    
    # 1. Parse the URL to get the target path parameters
    patch_url = parse_github_url(url)

    headers = {
        "User-Agent": "PR-Risk-Analyzer/1.0",
        "Accept": "*/*"
    }

    # Add token authorization if it's a private repo or to avoid rate limiting
    if github_token:
        headers["Authorization"] = f"token {github_token}"
        
    try:
        # 4. Make the network request to GitHub
        response = requests.get(patch_url, headers=headers, timeout=60)
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository or Pull Request not found.")
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch diff from GitHub.")

        content_type = response.headers.get("Content-Type", "")
        if "text/html" in content_type:
            raise HTTPException(
                status_code=502,
                detail="GitHub returned an unexpected HTML page instead of patch data. The PR may not exist or may be inaccessible."
            )    
        
        # Return the raw text difference
        return response.text
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error connecting to GitHub: {str(e)}")
