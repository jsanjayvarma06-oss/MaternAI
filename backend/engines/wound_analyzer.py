import os
import json
from google import genai
from google.genai import types
from backend.models.patient import WoundAssessment

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

async def analyse_wound_photo(image_base64: str, day_post_delivery: int) -> WoundAssessment:
    prompt = f"""Assess this postpartum C-section wound photo taken on day {day_post_delivery}.
    Return ONLY valid JSON with these fields:
    - redness: none | mild | moderate | severe
    - discharge: none | serous | purulent
    - swelling: none | mild | significant
    - edges: intact | slightly_separated | gaping
    - photo_score: healing_well | monitor | see_doctor | emergency
    - patient_explanation: one warm sentence in plain language
    
    Scoring rules:
    healing_well = no redness, no discharge, edges intact
    monitor = mild redness only, edges intact
    see_doctor = moderate redness OR any discharge OR mild separation
    emergency = purulent discharge OR gaping OR severe redness
    
    Do not describe the wound graphically."""
    
    try:
        # Assuming image_base64 is a raw base64 string, not data URI
        response = client.models.generate_content(
            model='gemini-2.5-pro', # 3.1 Pro isn't standard SDK enum yet, 'gemini-2.5-pro' works for testing
            contents=[prompt, types.Part.from_bytes(data=bytes.fromhex(image_base64), mime_type='image/jpeg')]
        )
        
        # Clean the response text from potential markdown ticks
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        
        data = json.loads(text.strip())
        return WoundAssessment(
            applicable=True,
            photo_score=data.get("photo_score"),
            redness=data.get("redness"),
            discharge=data.get("discharge"),
            swelling=data.get("swelling"),
            edges=data.get("edges"),
            patient_explanation=data.get("patient_explanation")
        )

    except Exception as e:
        print(f"Error calling Gemini: {e}")
        # Graceful fallback on API error as requested
        return WoundAssessment(
            applicable=True,
            photo_score="monitor",
            patient_explanation="Your uploaded photo has been saved, but our AI is temporarily unavailable to provide immediate feedback. Please monitor your wound according to your doctor's advice."
        )
