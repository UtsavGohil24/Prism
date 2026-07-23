import os
from google import genai
from google.genai import types
from fastapi import HTTPException

CHAT_MODEL = "gemini-2.5-flash"

def build_chat_system_prompt(report: dict) -> str:
    files_summary = "\n".join(
        f"- {f['filename']} (risk: {f['risk_level']}, {len(f.get('bugs', []))} bug(s))"
        for f in report.get("files", [])
    )

    bugs_summary = "\n".join(
        f"- [{bug['severity']}] {f['filename']}: {bug['description']}"
        for f in report.get("files", [])
        for bug in f.get("bugs", [])
    )

    factors_summary = "\n".join(
        f"- {factor['reason']} (+{factor['points']} points)" if factor.get("points") else f"- {factor['reason']}"
        for factor in report.get("risk_factors", [])
    )

    return (
        "You are a helpful code review assistant answering questions about a specific pull request. "
        "Only use the information provided below — do not invent details about files, bugs, or "
        "changes that aren't listed here. If something isn't covered by this data, say so honestly "
        "rather than guessing.\n\n"
        f"PR: {report.get('pr_title', 'Unknown')}\n"
        f"Overall risk score: {report.get('overall_risk_score')}/100\n"
        f"Merge recommendation: {report.get('merge_recommendation')}\n\n"
        f"Files changed:\n{files_summary}\n\n"
        f"Bugs found:\n{bugs_summary if bugs_summary else 'None'}\n\n"
        f"Risk factors:\n{factors_summary if factors_summary else 'None'}\n\n"
        "Answer the user's questions clearly and concisely, referencing specific files and bugs "
        "by name when relevant."
    )

def get_chat_reply(report: dict, message: str, history: list[dict]) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API Key missing. Ensure GEMINI_API_KEY is defined in your .env file."
        )

    system_prompt = build_chat_system_prompt(report)

    # Build conversation contents: prior turns + new message
    contents = []
    for turn in history:
        contents.append(
            types.Content(
                role="user" if turn["role"] == "user" else "model",
                parts=[types.Part(text=turn["content"])]
            )
        )
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=CHAT_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.3,
                max_output_tokens=2048,
            ),
        )
        if not response or not response.text:
            raise ValueError("Empty response from Gemini")
        return response.text

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat request failed: {str(e)}"
        )