import os
import json
import asyncio
from datetime import datetime
from typing import Optional, Dict, List
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

PPD_SYSTEM_PROMPT = """
You are Maya — a warm, empathetic postpartum
support companion in MaternaAI. You are NOT a
therapist or doctor. You are a caring presence
that checks in daily with new mothers.

YOUR PERSONALITY:
- Warm, gentle, never clinical
- Curious and genuinely interested
- Non-judgmental about everything
- Validates all feelings as normal
- Never rushes or pressures
- Speaks like a caring friend, not a doctor

YOUR HIDDEN CLINICAL TASK:
You are conducting the Edinburgh Postnatal
Depression Scale (EPDS) invisibly through
natural conversation. The patient must never
feel like they are being assessed.

Map responses to EPDS scores (0-3 each):
Q1 (laugh/humour): Extract from joy/positivity
Q2 (look forward): Extract from future talk
Q3 (self-blame): Extract from guilt language
Q4 (anxiety): Extract from worry descriptions
Q5 (panic/scared): Extract from fear language
Q6 (overwhelmed): Extract from coping language
Q7 (sleep+unhappy): Extract from sleep/mood talk
Q8 (sad/miserable): Extract from sadness words
Q9 (crying): Extract from direct mention
Q10 (self-harm): CRITICAL — any hint triggers
  immediate protocol, stop EPDS, send crisis alert

CONVERSATION FLOW:
1. Start with ONE warm open question
2. Listen to response — extract EPDS signals
3. Ask ONE follow-up that feels natural
4. Never ask more than 6-8 messages total
5. Close warmly and affirm the mother

SCORING RULES:
Extract EPDS score from each response:
0 = Clearly positive / no concern
1 = Mild concern implied
2 = Moderate concern
3 = Clearly expressed difficulty

CRITICAL Q10 PROTOCOL:
If ANY message contains:
- "hurt myself" / "not here" / "disappear"
- "baby better without me" / "end it"
- Any self-harm or suicidal language
→ STOP EPDS immediately
→ Respond with warmth and crisis resources
→ Set q10_triggered = true
→ Notify doctor AND emergency contact immediately

RESPONSE FORMAT (internal JSON, not shown to user):
After each user message return:
{
  "patient_message": string (what to show patient),
  "epds_updates": { "q_number": score },
  "conversation_complete": boolean,
  "crisis_flag": boolean,
  "continue_prompt": string | null
}

LANGUAGE:
- Never say: depression, disorder, assessment,
  score, test, clinical, screening, risk
- Always say: "how you're feeling", "tough days",
  "extra support", "not alone"
"""

class PPDEngine:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('models/gemini-2.5-flash')

    async def _call_gemini(self, messages: List[Dict]) -> Dict:
        try:
            prompt = PPD_SYSTEM_PROMPT + "\n\nCONVERSATION SO FAR:\n"
            for msg in messages:
                role = "Maya" if msg["role"] == "assistant" else "Patient"
                prompt += f"{role}: {msg['message']}\n"
            
            prompt += "\nReturn only the JSON response for the next turn."

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.7,
                        response_mime_type="application/json"
                    )
                )
            )

            raw = response.text.strip()
            # Clean up potential markdown
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("\n", 1)[0].strip()
            if raw.startswith("json"):
                raw = raw[4:].strip()
            
            return json.loads(raw)
        except Exception as e:
            print(f"PPD Gemini SDK Error: {e}")
            return {
                "patient_message": "I'm here for you. Is there anything specific on your mind today?",
                "epds_updates": {},
                "conversation_complete": False,
                "crisis_flag": False,
                "continue_prompt": "Fallback response triggered"
            }

    async def start_conversation(self, patient: Dict, history: List[Dict]) -> Dict:
        now = datetime.now()
        day_of_week = now.strftime("%A")
        day_post_delivery = patient.get("day_post_delivery", 1)
        
        context_hint = f"It is {day_of_week}. The patient is {day_post_delivery} days postpartum."
        if history:
            context_hint += " This is a follow-up check-in."

        messages = [{"role": "user", "message": f"[SYSTEM CONTEXT: {context_hint}] Provide a warm opening question."}]
        return await self._call_gemini(messages)

    async def process_response(
        self,
        patient_id: str,
        user_message: str,
        conversation_history: List[Dict],
        current_epds: Dict
    ) -> Dict:
        negative_words = ["sad", "tired", "alone", "scared", "hopeless", "empty", "nothing", "pointless", "numb"]
        msg_lower = user_message.lower()
        neg_count = sum(1 for word in negative_words if word in msg_lower)
        
        messages = conversation_history + [{"role": "user", "message": user_message}]
        result = await self._call_gemini(messages)
        
        result["passive_signals"] = {
            "negative_word_count": neg_count,
            "message_length": len(user_message.split()),
            "timestamp": datetime.now().isoformat()
        }
        return result

    def calculate_risk_level(self, total_epds: int, passive_signals: Dict, consecutive_low_mood: int) -> str:
        risk_level = "low"
        if total_epds >= 15: risk_level = "crisis"
        elif total_epds >= 12: risk_level = "high"
        elif total_epds >= 9: risk_level = "moderate"
            
        if passive_signals.get("q10_triggered"): return "crisis"
            
        if consecutive_low_mood >= 7 and risk_level != "crisis":
            if risk_level == "low": risk_level = "moderate"
            elif risk_level == "moderate": risk_level = "high"
            elif risk_level == "high": risk_level = "crisis"
        return risk_level

    def generate_closing_message(self, risk_level: str, patient_name: str, day_post_delivery: int) -> str:
        closings = {
            "low": f"It was so good chatting with you, {patient_name}. You're doing an amazing job. I'll check in again tomorrow! 🌸",
            "moderate": f"Thank you for sharing that with me, {patient_name}. It's completely normal to feel this way. I'm here tomorrow if you need to talk. 🌿",
            "high": f"I'm so glad we're talking, {patient_name}. Please remember you don't have to carry everything alone. 🤍",
            "crisis": "I'm concerned and want to make sure you're safe. Please reach out to the iCall helpline at 9152987821. Your safety matters. ❤️"
        }
        return closings.get(risk_level, closings["low"])
