import os
import json
import asyncio

# Use the new google.genai SDK (replaces deprecated google.generativeai)
from google import genai
from google.genai import types

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
    return _client

async def generate_clinical_insight(reading: dict, history: list) -> dict:
    prompt = f"""You are MaternaAI's postpartum health AI.
Analyse this patient's daily reading and history.
Return ONLY valid JSON (no markdown, no code blocks) with these exact keys:
- patient_message: 2-3 warm sentences, plain language
- recommended_action: one specific action
- doctor_notification: {{ "required": bool, "urgency": "low"|"medium"|"high", "summary": string }}
- insights: list of up to 3 trend observations from the 7-day data

Patient's Today Reading:
{json.dumps(reading, indent=2, default=str)}

Patient's 7-Day History:
{json.dumps(history[:7], indent=2, default=str)}"""

    try:
        client = _get_client()

        # Run in thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model="gemini-1.5-pro",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
        )

        raw = response.text.strip()
        # Strip any accidental markdown fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())

    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Graceful fallback — never crash the reading save
        return {
            "patient_message": "Thank you for checking in today. Your data has been recorded and is being monitored.",
            "recommended_action": "Rest well, stay hydrated, and continue monitoring your vitals daily.",
            "doctor_notification": {"required": False, "urgency": "low", "summary": ""},
            "insights": ["Data recorded successfully. Trend analysis will improve with more daily check-ins."]
        }
