from datetime import datetime
from typing import Optional

# ─── Week Context ─────────────────────────────────────────────────────────────

def get_week_context(day_post_delivery: int) -> str:
    if day_post_delivery <= 7:
        return "Week 1 — Your body just did something incredible. Rest is your only job right now."
    elif day_post_delivery <= 14:
        return "Week 2 — Baby blues peak this week. Mood swings are completely normal and expected."
    elif day_post_delivery <= 21:
        return "Week 3 — Often the hardest week emotionally. Exhaustion peaks, hormones are shifting. This is temporary — it gets better."
    elif day_post_delivery <= 28:
        return "Week 4 — You're past the hardest part. Small improvements in energy are coming."
    elif day_post_delivery <= 42:
        return "Weeks 5-6 — Hormones stabilising. Gentle activity can start helping mood."
    else:
        return "Beyond Week 6 — Recovery continues. Every day is progress."

# ─── Milestone Detection ──────────────────────────────────────────────────────

def check_milestone(day_post_delivery: int) -> Optional[str]:
    milestones = {
        7:  "First week complete — incredible achievement",
        14: "Two weeks of recovery — you're doing great",
        21: "Three weeks — the hardest part is behind you",
        42: "Six week mark — major recovery milestone",
    }
    return milestones.get(day_post_delivery)

# ─── Sleep Scoring ────────────────────────────────────────────────────────────

def _score_sleep(sleep: dict, history: list) -> int:
    score = 0
    total = sleep.get("total_hours", 6)
    stretch = sleep.get("longest_stretch_hours", 2)
    wakings = sleep.get("night_wakings", 2)
    quality = sleep.get("sleep_quality", 3)

    if total < 3:
        score += 50
    elif total < 5:
        score += 30
    elif total < 6:
        score += 15

    if stretch < 1.5:
        score += 25

    if wakings > 5:
        score += 20

    if quality <= 2:
        score += 15

    # 3+ consecutive days under 4 hours (from history)
    consecutive_low = 0
    for h in history[:3]:
        hrs = h.get("sleep", {}).get("total_hours", 6)
        if hrs < 4:
            consecutive_low += 1
    if consecutive_low >= 3:
        score += 20

    return min(100, score)

# ─── Activity Scoring ─────────────────────────────────────────────────────────

def _score_activity(activity: dict, history: list, day_post_delivery: int) -> int:
    score = 0
    walked = activity.get("walked_today", False)
    exercise = activity.get("exercise_attempted", False)
    too_tired = activity.get("felt_too_tired_to_move", False)
    steps = activity.get("steps_count")

    if day_post_delivery <= 7:
        if exercise:
            score += 40  # Too early — flag overexertion

    elif day_post_delivery <= 21:
        # Count tired days in history
        tired_days = sum(1 for h in history[:3] if h.get("activity", {}).get("felt_too_tired_to_move", False))
        if tired_days >= 3:
            score += 30
        # Count days without walk in last 5
        no_walk_days = sum(1 for h in history[:5] if not h.get("activity", {}).get("walked_today", True))
        if no_walk_days >= 5:
            score += 20

    else:
        # No activity for 7 days
        active_days = sum(1 for h in history[:7] if h.get("activity", {}).get("walked_today", False))
        if active_days == 0:
            score += 35
        # Steps < 500 for 5 days
        low_step_days = sum(
            1 for h in history[:5]
            if (h.get("activity", {}).get("steps_count") or 999) < 500
        )
        if low_step_days >= 5:
            score += 20

    return min(100, score)

# ─── Hormonal / Mood Scoring ──────────────────────────────────────────────────

def _score_hormonal(hormonal: dict, history: list) -> int:
    score = 0
    mood = hormonal.get("mood_score", 3)
    crying = hormonal.get("crying_spells", False)
    overwhelmed = hormonal.get("felt_overwhelmed", False)
    anxiety = hormonal.get("anxiety_level", 2)
    bonded = hormonal.get("felt_bonded_with_baby", True)
    support = hormonal.get("support_received_today", True)

    if mood <= 2:
        score += 25

    # 3+ consecutive low mood days
    low_mood_days = sum(1 for h in history[:3] if h.get("hormonal", {}).get("mood_score", 3) <= 2)
    if low_mood_days >= 3:
        score += 30

    if crying and overwhelmed:
        score += 20

    if anxiety >= 4:
        score += 20

    # Not bonded for 3+ days
    not_bonded_days = sum(1 for h in history[:3] if not h.get("hormonal", {}).get("felt_bonded_with_baby", True))
    if not_bonded_days >= 3:
        score += 25

    # No support for 5+ days
    no_support_days = sum(1 for h in history[:5] if not h.get("hormonal", {}).get("support_received_today", True))
    if no_support_days >= 5:
        score += 15

    return min(100, score)

# ─── Overall Wellbeing ────────────────────────────────────────────────────────

def _overall(sleep_score: int, activity_score: int, hormonal_score: int) -> str:
    if all(s < 30 for s in [sleep_score, activity_score, hormonal_score]):
        return "good"
    if any(s >= 60 for s in [sleep_score, activity_score, hormonal_score]):
        return "support_needed"
    return "monitor"

# ─── Main Entry Point ─────────────────────────────────────────────────────────

def calculate_wellbeing_scores(
    wellbeing: dict,
    history: list,
    day_post_delivery: int
) -> dict:
    """
    wellbeing: the current day's wellbeing log dict (sleep, activity, hormonal sections)
    history:   list of past wellbeing_log dicts (newest first)
    day_post_delivery: int
    """
    sleep = wellbeing.get("sleep", {})
    activity = wellbeing.get("activity", {})
    hormonal = wellbeing.get("hormonal", {})

    sleep_score = _score_sleep(sleep, history)
    activity_score = _score_activity(activity, history, day_post_delivery)
    hormonal_score = _score_hormonal(hormonal, history)
    overall = _overall(sleep_score, activity_score, hormonal_score)
    week_context = get_week_context(day_post_delivery)
    milestone = check_milestone(day_post_delivery)

    # Check PPD flag: mood <= 2 for 3+ consecutive days
    low_mood_streak = sum(1 for h in history[:2] if h.get("hormonal", {}).get("mood_score", 3) <= 2)
    ppd_risk_flag = (hormonal.get("mood_score", 3) <= 2 and low_mood_streak >= 2) or hormonal_score >= 60

    gemini_context = f"""
WELLBEING DATA (Engine 4):
Sleep last night: {sleep.get('total_hours', 'N/A')} hours
Longest stretch: {sleep.get('longest_stretch_hours', 'N/A')} hours
Mood today: {hormonal.get('mood_score', 'N/A')}/5
Anxiety level: {hormonal.get('anxiety_level', 'N/A')}/5
Activity: {'Walked today' if activity.get('walked_today') else 'Did not walk today'}
Week context: {week_context}
Hormonal concern score: {hormonal_score}/100
Sleep concern score: {sleep_score}/100
PPD risk flag: {ppd_risk_flag}
Milestone: {milestone or 'None'}

Instructions for Gemini based on wellbeing data:
- If hormonal_score >= 60 or PPD risk flag is true: add a warm supportive line to patient_message. Add ppd_risk_flag: true to doctor_notification.
- If sleep_score >= 50: include specific sleep advice in patient_message.
- If milestone is set: celebrate it warmly in patient_message.
- Always include week_context naturally in the response.
- NEVER use the word 'depression' in patient_message. Use 'difficult time', 'low mood', or 'extra support'.
"""

    return {
        "sleep_score": sleep_score,
        "activity_score": activity_score,
        "hormonal_score": hormonal_score,
        "overall_wellbeing": overall,
        "week_context": week_context,
        "milestone_reached": milestone,
        "ppd_risk_flag": ppd_risk_flag,
        "gemini_prompt_context": gemini_context
    }
