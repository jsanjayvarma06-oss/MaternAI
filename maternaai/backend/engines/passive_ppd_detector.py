"""
Engine 2 — Passive PPD Detector
Silently analyses existing MongoDB data to detect PPD signals
without requiring any extra input from the patient.
"""
from datetime import datetime, timedelta
from typing import Optional
import pymongo


async def detect_passive_signals(patient_id: str, days: int = 7) -> dict:
    from backend.db.mongodb import (
        wellbeing_logs_collection,
        readings_collection,
        ppd_assessments_collection
    )

    # Pull last N days of wellbeing logs
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    wb_cursor = wellbeing_logs_collection.find(
        {"patient_id": patient_id, "timestamp": {"$gte": cutoff}}
    ).sort("timestamp", pymongo.DESCENDING)
    wb_docs = await wb_cursor.to_list(length=days)

    # Pull readings (for checkin timestamps)
    rd_cursor = readings_collection.find(
        {"patient_id": patient_id, "timestamp": {"$gte": cutoff}}
    ).sort("timestamp", pymongo.DESCENDING)
    rd_docs = await rd_cursor.to_list(length=days)

    # Pull ppd_assessments for skip/response analysis
    ppd_cursor = ppd_assessments_collection.find(
        {"patient_id": patient_id, "timestamp": {"$gte": cutoff}}
    ).sort("timestamp", pymongo.DESCENDING)
    ppd_docs = await ppd_cursor.to_list(length=days)

    # ─── Mood trend ──────────────────────────────────────────────────────────
    mood_scores = [w.get("hormonal", {}).get("mood_score", 3) for w in wb_docs]
    mood_trend_7d = mood_scores[:7]

    # Consecutive low mood (mood_score <= 2)
    consecutive_low_mood = 0
    for score in mood_scores:
        if score <= 2:
            consecutive_low_mood += 1
        else:
            break

    # ─── Social withdrawal ────────────────────────────────────────────────────
    no_support_days = sum(
        1 for w in wb_docs if not w.get("hormonal", {}).get("support_received_today", True)
    )
    no_bonding_days = sum(
        1 for w in wb_docs if not w.get("hormonal", {}).get("felt_bonded_with_baby", True)
    )
    social_withdrawal = (no_support_days >= 5) and (no_bonding_days >= 3)

    # ─── Sleep anxiety pattern (3am+ check-ins) ───────────────────────────────
    night_checkins = sum(
        1 for r in rd_docs
        if _extract_hour(r.get("timestamp", "")) in range(0, 5)
    )
    sleep_quality_avg = (
        sum(w.get("sleep", {}).get("sleep_quality", 3) for w in wb_docs) / len(wb_docs)
        if wb_docs else 3
    )
    sleep_anxiety_pattern = (night_checkins >= 3) and (sleep_quality_avg <= 2)

    # ─── Crying frequency ────────────────────────────────────────────────────
    crying_days = sum(
        1 for w in wb_docs if w.get("hormonal", {}).get("crying_spells", False)
    )

    # ─── Response length from PPD conversations ───────────────────────────────
    all_user_messages = []
    for ppd in ppd_docs:
        for turn in ppd.get("conversation_transcript", []):
            if turn.get("role") == "user":
                all_user_messages.append(turn.get("message", ""))
    response_length_avg = (
        sum(len(m.split()) for m in all_user_messages) / len(all_user_messages)
        if all_user_messages else 20
    )
    short_response_count = sum(1 for m in all_user_messages if len(m.split()) < 5)
    social_withdrawal = social_withdrawal or (short_response_count >= 3 and len(all_user_messages) >= 5)

    # ─── Skipped days ────────────────────────────────────────────────────────
    skipped_days = days - len(wb_docs)

    # ─── Passive risk score (0-100) ───────────────────────────────────────────
    passive_risk_score = 0
    if consecutive_low_mood >= 7:
        passive_risk_score += 40
    elif consecutive_low_mood >= 3:
        passive_risk_score += 20

    if social_withdrawal:
        passive_risk_score += 25
    if sleep_anxiety_pattern:
        passive_risk_score += 20
    if crying_days >= 5:
        passive_risk_score += 15
    if no_bonding_days >= 3:
        passive_risk_score += 20

    passive_risk_score = min(100, passive_risk_score)

    return {
        "consecutive_low_mood": consecutive_low_mood,
        "social_withdrawal": social_withdrawal,
        "sleep_anxiety_pattern": sleep_anxiety_pattern,
        "crying_days": crying_days,
        "night_message_count": night_checkins,
        "response_length_avg": round(response_length_avg, 1),
        "skipped_days": skipped_days,
        "mood_trend_7d": mood_trend_7d,
        "passive_risk_score": passive_risk_score,
    }


def _extract_hour(timestamp_str: str) -> int:
    """Extract hour from ISO timestamp string."""
    try:
        dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        return dt.hour
    except Exception:
        return 12
