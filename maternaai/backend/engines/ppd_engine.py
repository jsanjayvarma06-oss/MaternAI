"""
Engine 2 — PPD Detector
Gemini-powered Maya companion that invisibly conducts EPDS assessment
through warm, natural conversation. Patient never knows they are being assessed.
"""
import json
import re
import os
from datetime import datetime
from typing import Optional, List, Dict
from backend.engines.wellbeing_engine import get_week_context

PPD_SYSTEM_PROMPT = """
You are Maya — a warm, empathetic postpartum support companion in MaternaAI.
You are NOT a therapist or doctor. You are a caring presence that checks in daily with new mothers.

YOUR PERSONALITY:
- Warm, gentle, never clinical
- Curious and genuinely interested
- Non-judgmental about everything
- Validates all feelings as normal
- Never rushes or pressures
- Speaks like a caring friend, not a doctor

YOUR HIDDEN CLINICAL TASK:
You are invisibly conducting an Edinburgh Postnatal Depression Scale (EPDS) assessment
through natural conversation. The patient must NEVER feel like they are being assessed.

MAP RESPONSES TO EPDS SCORES (0-3 each):
Q1 (laugh/humour): Extract from joy, positivity, finding things funny
Q2 (look forward): Extract from future plans, anticipation, hope
Q3 (self-blame): Extract from guilt language, "my fault", "I should have"
Q4 (anxiety): Extract from worry, tension, nervousness descriptions
Q5 (panic/scared): Extract from fear, panic, being frightened language
Q6 (overwhelmed): Extract from "too much", "can't cope", "drowning"
Q7 (sleep+unhappy): Extract from sleep quality combined with overall unhappiness
Q8 (sad/miserable): Extract from sadness, heaviness, emptiness, low mood
Q9 (crying): Extract from direct mention of tears or crying
Q10 (self-harm): CRITICAL — any hint triggers immediate crisis protocol

CONVERSATION FLOW:
1. Start with ONE warm open question (never more than 2 sentences)
2. Listen to response — extract EPDS signals silently
3. Ask ONE follow-up that feels completely natural
4. Never ask more than 6-8 messages total
5. Close warmly with genuine affirmation

SCORING RULES:
Extract EPDS score from each response (if unclear, default to 0):
0 = Clearly positive / no concern expressed
1 = Mild hint of concern
2 = Moderate concern clearly implied
3 = Clearly expressed difficulty or distress

CRITICAL Q10 PROTOCOL:
If ANY message contains phrases like:
"hurt myself", "not here anymore", "disappear", "baby better without me",
"end it", "can't go on", "don't want to be here", "wish I wasn't here",
any self-harm or suicidal language
→ IMMEDIATELY set crisis_flag = true
→ Respond ONLY with warmth + crisis resources (never abruptly)
→ Do NOT continue EPDS questions
→ Keep patient engaged until resources shown

RESPONSE FORMAT — return ONLY valid JSON:
{
  "patient_message": "what to show patient (warm, natural, 1-3 sentences)",
  "epds_updates": {"q1": 0, "q2": 0},
  "conversation_complete": false,
  "crisis_flag": false,
  "continue_prompt": "internal note for next question direction (not shown)"
}

LANGUAGE RULES — NEVER use these words with patient:
depression, disorder, EPDS, score, assessment, screening, risk, test, clinical,
questionnaire, evaluation, measure, mental health check

ALWAYS use instead:
"how you're feeling", "tough days", "low moments", "extra support",
"not alone", "many mums feel this way", "having a hard time"
"""

CRISIS_WORDS = [
    "hurt myself", "hurt myself", "not here anymore", "disappear",
    "baby better without me", "end it", "can't go on", "don't want to be here",
    "wish I wasn't here", "kill myself", "die", "not worth it", "give up on life",
    "no point", "nobody would miss", "better off without me", "self harm", "cutting"
]

NEGATIVE_WORDS = [
    "sad", "tired", "exhausted", "alone", "scared", "hopeless", "empty",
    "nothing", "pointless", "numb", "worthless", "broken", "failing",
    "overwhelmed", "drowning", "trapped", "lost", "dark", "miserable"
]


class PPDEngine:

    def __init__(self):
        self._client = None

    def _get_client(self):
        from google import genai
        if self._client is None:
            self._client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
        return self._client

    async def _call_gemini(self, messages: List[Dict]) -> dict:
        """Call Gemini with conversation history, return parsed JSON."""
        import asyncio
        from concurrent.futures import ThreadPoolExecutor

        def _sync_call():
            client = self._get_client()
            from google.genai import types
            # Build contents from message history
            contents = []
            for m in messages:
                role = "user" if m["role"] == "user" else "model"
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part(text=m["content"])]
                ))

            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=PPD_SYSTEM_PROMPT,
                    temperature=0.7,
                    max_output_tokens=512,
                )
            )
            return response.text

        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as pool:
            raw = await loop.run_in_executor(pool, _sync_call)

        # Strip markdown code fences if present
        cleaned = re.sub(r"```(?:json)?\n?", "", raw).strip().rstrip("```").strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback — extract JSON object
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                return json.loads(match.group())
            return {
                "patient_message": "I'm so glad you're here. How are you feeling today?",
                "epds_updates": {},
                "conversation_complete": False,
                "crisis_flag": False,
                "continue_prompt": None
            }

    def _check_crisis_words(self, text: str) -> bool:
        """Check if text contains any crisis language."""
        text_lower = text.lower()
        return any(word in text_lower for word in CRISIS_WORDS)

    def _count_negative_words(self, text: str) -> int:
        text_lower = text.lower()
        return sum(1 for w in NEGATIVE_WORDS if w in text_lower)

    async def start_conversation(self, patient: dict, history: list) -> dict:
        """Generate context-aware opening message from Maya."""
        name = patient.get("name", "").split()[0] if patient.get("name") else "there"
        day = patient.get("day_post_delivery", 7)
        week_ctx = get_week_context(day)

        # Check recent mood history for personalised opener
        recent_mood = None
        if history:
            last = history[0]
            recent_mood = last.get("hormonal", {}).get("mood_score")

        # Day-of-week opener
        now = datetime.utcnow()
        dow = now.strftime("%A")
        day_part = ""
        if dow == "Monday":
            day_part = "How was your weekend?"
        elif dow == "Friday":
            day_part = "Almost the weekend — how are you holding up?"

        context_note = f"""
Patient context:
- First name: {name}
- Day post delivery: {day}
- Week context: {week_ctx}
- Recent mood (1-5, if available): {recent_mood or 'unknown'}
- Day of week: {dow}
- Day part hint: {day_part}

Open with a single warm, natural greeting. 1-2 sentences max.
Ask ONE gentle open question about how they are feeling today.
Do NOT mention the week context explicitly — just let it inform your tone.
"""
        messages = [{"role": "user", "content": context_note}]
        result = await self._call_gemini(messages)
        return {
            "message": result.get("patient_message", f"Hi {name}! How are you feeling today?"),
            "epds_updates": result.get("epds_updates", {}),
            "crisis_flag": result.get("crisis_flag", False),
            "conversation_complete": False,
            "quick_replies": ["I'm okay", "Pretty tired", "It's been hard", "Good, actually"]
        }

    async def process_response(
        self,
        patient_id: str,
        user_message: str,
        conversation_history: list,
        current_epds: dict
    ) -> dict:
        """Process a patient message, update EPDS, return next Maya message."""

        # Crisis check first — override everything
        if self._check_crisis_words(user_message):
            return {
                "message": (
                    "I hear you, and I'm so glad you told me that. "
                    "What you're feeling matters deeply, and you deserve support right now. "
                    "Please reach out to iCall at 9152987821 or Vandrevala Foundation at 1860-2662-345 — "
                    "they're available 24/7 and will listen without judgment. "
                    "You are not alone in this. 💙"
                ),
                "epds_updates": {"q10": 3},
                "crisis_flag": True,
                "conversation_complete": True,
                "show_crisis_resources": True,
                "quick_replies": []
            }

        # Passive signals
        neg_count = self._count_negative_words(user_message)
        word_count = len(user_message.strip().split())

        # Build Gemini messages
        messages = []
        for turn in conversation_history:
            messages.append({
                "role": turn["role"],
                "content": turn["message"]
            })
        messages.append({"role": "user", "content": user_message})

        # Add EPDS state context
        epds_context = f"\n[Internal context — EPDS collected so far: {json.dumps(current_epds)}. Continue naturally.]"
        messages[-1]["content"] += epds_context

        result = await self._call_gemini(messages)

        # Enforce crisis check on Gemini output too
        if result.get("crisis_flag"):
            return {
                "message": (
                    "Thank you for trusting me with that. You are so brave. "
                    "Please know that support is available right now — iCall: 9152987821 is there for you. 💙"
                ),
                "epds_updates": {"q10": 3},
                "crisis_flag": True,
                "conversation_complete": True,
                "show_crisis_resources": True,
                "quick_replies": []
            }

        quick_replies = []
        if not result.get("conversation_complete"):
            quick_replies = ["Yes", "A little", "Not really", "Very much"]

        return {
            "message": result.get("patient_message", "Tell me more about that..."),
            "epds_updates": result.get("epds_updates", {}),
            "crisis_flag": False,
            "conversation_complete": result.get("conversation_complete", False),
            "show_crisis_resources": False,
            "passive_signals": {
                "negative_word_count": neg_count,
                "word_count": word_count,
                "timestamp_hour": datetime.utcnow().hour
            },
            "quick_replies": quick_replies
        }

    def calculate_risk_level(
        self,
        total_epds: int,
        passive_signals: dict,
        consecutive_low_mood: int,
        q10_triggered: bool = False
    ) -> str:
        """Map EPDS total + passive signals to risk level."""
        if q10_triggered:
            return "crisis"

        if total_epds >= 15:
            level = "crisis"
        elif total_epds >= 12:
            level = "high"
        elif total_epds >= 9:
            level = "moderate"
        else:
            level = "low"

        # Upgrade rules
        rank = {"low": 0, "moderate": 1, "high": 2, "crisis": 3}
        levels = ["low", "moderate", "high", "crisis"]

        def upgrade(current: str) -> str:
            idx = rank[current]
            return levels[min(idx + 1, 3)]

        if consecutive_low_mood >= 7:
            level = upgrade(level)
        if passive_signals.get("social_withdrawal") and rank[level] >= rank["high"]:
            level = upgrade(level)
        if passive_signals.get("sleep_anxiety_pattern") and passive_signals.get("night_message_count", 0) >= 3:
            level = upgrade(level)

        return level

    def generate_closing_message(
        self,
        risk_level: str,
        patient_name: str,
        day_post_delivery: int
    ) -> str:
        name = patient_name.split()[0] if patient_name else "there"
        week = (day_post_delivery // 7) + 1

        if risk_level == "low":
            return (
                f"It's so good to hear from you, {name}. "
                f"Week {week} is a big deal — you're doing something incredible every single day. "
                "I'll check in with you again tomorrow. Take care of yourself tonight. 💙"
            )
        elif risk_level == "moderate":
            return (
                f"Thank you for being open with me today, {name}. "
                "Tough days happen — they really do — and they don't define how you're doing overall. "
                "Have you been able to get outside, even just for a few minutes? "
                "Small moments like that can matter. I'm always here. 💙"
            )
        elif risk_level == "high":
            return (
                f"I really appreciate you sharing that with me, {name}. "
                "What you're going through sounds genuinely hard, and you deserve support. "
                "Many mums find it helpful to have a conversation with their doctor — "
                "not because anything is wrong, but because you deserve someone in your corner. "
                "You're not alone in this. 💙"
            )
        else:  # crisis
            return (
                f"{name}, I hear you. What you're feeling right now is real and it matters. "
                "Please reach out for support right now — iCall (9152987821) and "
                "Vandrevala Foundation (1860-2662-345) are there 24/7. "
                "You are loved and you are not alone. 💙"
            )

    def get_patient_facing_status(self, risk_level: str) -> str:
        """Return patient-safe description of their status — no clinical terms."""
        messages = {
            "low": "You're doing really well. Keep going.",
            "moderate": "You're having some tough days — that's completely okay.",
            "high": "It sounds like you could use some extra support right now.",
            "crisis": "You deserve immediate support. You are not alone."
        }
        return messages.get(risk_level, "You're doing your best, and that's enough.")
