import os
import json
import asyncio
import google.generativeai as genai

_client_configured = False

def _ensure_configured():
    global _client_configured
    if not _client_configured:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        genai.configure(api_key=api_key)
        _client_configured = True

async def generate_clinical_insight(reading: dict, history: list, wellbeing_context: str = "") -> dict:
    _ensure_configured()
    
    prompt = f"""You are MaternaAI's postpartum health AI.
Analyse this patient's daily reading and history.
Return ONLY valid JSON (no markdown, no code blocks) with these exact keys:
- patient_message: 2-3 warm sentences, plain language
- recommended_action: one specific action
- doctor_notification: {{ "required": bool, "urgency": "low"|"medium"|"high", "summary": string, "ppd_risk_flag": bool }}
- insights: list of up to 3 trend observations from the 7-day data

Patient's Today Reading:
{json.dumps(reading, indent=2, default=str)}

Patient's 7-Day History:
{json.dumps(history[:7], indent=2, default=str)}"""

    if wellbeing_context:
        prompt += f"\n\n{wellbeing_context}"

    try:
        model = genai.GenerativeModel('models/gemini-2.5-pro')
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
        )

        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())

    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {
            "patient_message": "Thank you for checking in today. Your data has been recorded and is being monitored.",
            "recommended_action": "Rest well, stay hydrated, and continue monitoring your vitals daily.",
            "doctor_notification": {"required": False, "urgency": "low", "summary": ""},
            "insights": ["Data recorded successfully. Trend analysis will improve with more daily check-ins."]
        }
