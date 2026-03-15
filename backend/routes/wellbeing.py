"""
Engine 4 — Wellbeing API Routes
POST /wellbeing           – Save a wellbeing log + run scoring
GET  /wellbeing/{id}      – Get last 7 days of logs
GET  /wellbeing/{id}/trend – Return aggregated trend arrays
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from backend.db.queries import (
    save_wellbeing_log,
    get_wellbeing_history,
    get_sleep_trend,
    get_mood_trend,
    get_activity_trend,
)
from backend.db.mongodb import analysis_results_collection, users_collection
from backend.engines.wellbeing_engine import calculate_wellbeing_scores

router = APIRouter()

# ─── Request Models ───────────────────────────────────────────────────────────

class SleepData(BaseModel):
    total_hours: float = 5.0
    longest_stretch_hours: float = 2.0
    night_wakings: int = 3
    sleep_quality: int = 3   # 1-5
    nap_taken: bool = False
    nap_duration_minutes: Optional[int] = None

class ActivityData(BaseModel):
    walked_today: bool = False
    walk_duration_minutes: Optional[int] = None
    exercise_attempted: bool = False
    exercise_type: Optional[str] = None
    felt_too_tired_to_move: bool = False
    steps_count: Optional[int] = None

class HormonalData(BaseModel):
    mood_score: int = 3        # 1-5
    crying_spells: bool = False
    felt_overwhelmed: bool = False
    felt_bonded_with_baby: bool = True
    anxiety_level: int = 2     # 1-5
    support_received_today: bool = True

class WellbeingRequest(BaseModel):
    patient_id: str
    sleep: SleepData
    activity: ActivityData
    hormonal: HormonalData

# ─── POST /wellbeing ──────────────────────────────────────────────────────────

@router.post("/wellbeing")
async def submit_wellbeing(req: WellbeingRequest):
    try:
        # Get patient for day_post_delivery
        patient = await users_collection.find_one({"_id": req.patient_id})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        birthdate = datetime.fromisoformat(patient["child_birthdate"])
        day_post_delivery = max(0, (datetime.utcnow() - birthdate).days)

        # Get wellbeing history for trend-aware scoring
        history = await get_wellbeing_history(req.patient_id, days=7)

        wellbeing_dict = {
            "sleep": req.sleep.model_dump(),
            "activity": req.activity.model_dump(),
            "hormonal": req.hormonal.model_dump()
        }

        # Run Engine 4 scoring
        scores = calculate_wellbeing_scores(
            wellbeing=wellbeing_dict,
            history=history,
            day_post_delivery=day_post_delivery
        )

        # Save wellbeing log
        timestamp = datetime.utcnow().isoformat()
        log_doc = {
            "patient_id": req.patient_id,
            "timestamp": timestamp,
            "day_post_delivery": day_post_delivery,
            "sleep": req.sleep.model_dump(),
            "activity": req.activity.model_dump(),
            "hormonal": req.hormonal.model_dump(),
            "recovery_milestone": {
                "week": (day_post_delivery // 7) + 1,
                "milestone_reached": scores["milestone_reached"],
                "milestone_flag": scores["milestone_reached"]
            },
            "scores": {
                "sleep_score": scores["sleep_score"],
                "activity_score": scores["activity_score"],
                "hormonal_score": scores["hormonal_score"],
                "overall_wellbeing": scores["overall_wellbeing"],
            }
        }
        log_id = await save_wellbeing_log(log_doc)

        # Merge wellbeing scores into today's analysis_result
        await analysis_results_collection.update_one(
            {"patient_id": req.patient_id},
            {"$set": {
                "wellbeing_scores": scores,
                "ppd_risk_flag": scores["ppd_risk_flag"],
                "week_context": scores["week_context"],
                "milestone_reached": scores["milestone_reached"],
            }},
            sort=[("timestamp", -1)]
        )

        # Create WELLBEING alert if support_needed
        if scores["overall_wellbeing"] == "support_needed" or scores["ppd_risk_flag"]:
            from backend.db.mongodb import alerts_collection
            doctor_id = patient.get("doctor_id")
            if doctor_id:
                await alerts_collection.insert_one({
                    "doctor_id": doctor_id,
                    "patient_id": req.patient_id,
                    "patient_name": patient.get("name"),
                    "status": "unread",
                    "timestamp": timestamp,
                    "alert_level": "WELLBEING",
                    "urgency": "routine",
                    "clinical_summary": f"Wellbeing concern flagged. Hormonal score: {scores['hormonal_score']}/100. Mood trend requires monitoring.",
                    "ppd_risk_flag": scores["ppd_risk_flag"]
                })

        return {
            "success": True,
            "log_id": log_id,
            "scores": scores
        }

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ─── GET /wellbeing/{patient_id} ──────────────────────────────────────────────

@router.get("/wellbeing/{patient_id}")
async def get_wellbeing(patient_id: str):
    try:
        history = await get_wellbeing_history(patient_id, days=7)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── GET /wellbeing/{patient_id}/trend ───────────────────────────────────────

@router.get("/wellbeing/{patient_id}/trend")
async def get_wellbeing_trend(patient_id: str):
    try:
        history = await get_wellbeing_history(patient_id, days=7)
        reversed_history = list(reversed(history))

        return {
            "sleep_trend": [h.get("sleep", {}).get("total_hours", 0) for h in reversed_history],
            "mood_trend": [h.get("hormonal", {}).get("mood_score", 3) for h in reversed_history],
            "activity_trend": [h.get("activity", {}).get("walked_today", False) for h in reversed_history],
            "week_contexts": [h.get("day_post_delivery", 0) for h in reversed_history],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
