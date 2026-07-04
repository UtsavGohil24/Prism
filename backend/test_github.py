import os
import requests
from services.github import fetch_pr_diff

TEST_URL = "https://github.com/microsoft/TypeScript/pull/63415"

print("🚀 Starting Phase 2 Live Test ...")

try:
    # Use a fresh request session that ignores system variables
    session = requests.Session()
    session.trust_env = False
    
    # Run your engine
    raw_diff = fetch_pr_diff(TEST_URL)
    
    print("✅ SUCCESS! The data pipeline is clear!")
    print(raw_diff[:400])

except Exception as e:
    print("❌ TEST FAILED!")
    print(f"Error Details: {str(e)}")