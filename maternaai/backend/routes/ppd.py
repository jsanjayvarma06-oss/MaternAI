"""
Engine 2 — PPD API Routes
POST /ppd/start            - Start Maya conversation
POST /ppd/respond          - Process patient message
POST /ppd/complete         - Finalize + run passive detector + alerts
GET  /ppd/should-show-full-chat/{patient_id}
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta

router = APIRouter()

# ─── Models ───────────────────────────────────────────────────────────────────

class StartRequest(BaseModel):
    patient_id: str

class RespondRequest(BaseModel):
    conversation_id: str
    patient_id: str
    message: str
    conversation_history: List[Dict] = []
    current_epds: Dict = {}

class CompleteRequest(BaseModel):
    conversation_id: str
    patient_id: str
    epds_scores: Dict
    conversation_transcript: List[Dict] = []
    passive_signals: Dict = {}
    flags: Dict = {}

# ─── POST /ppd/start ──────────────────────────────────────────────────────────

@router.post("/ppd/start")
async def start_ppd(req: StartRequest):
    try:
        from backend.db.mongodb import users_collection, ppd_assessments_collection
        from backend.db.queries import get_wellbeing_history, save_ppd_assessment
        from backend.engines.ppd_engine import PPDEngine

        patient = await users_collection.find_one({"_id": req.patient_id})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Compute day post delivery
        try:
            birthdate = datetime.fromisoformat(patient.get("child_birthdate", datetime.utcnow().isoformat()))
            day_post_delivery = max(0, (datetime.utcnow() - birthdate).days)
        except Exception:
            day_post_delivery = 7

        patient["day_post_delivery"] = day_post_delivery

        wb_history = await get_wellbeing_history(req.patient_id, days=7)

        engine = PPDEngine()
        result = await engine.start_conversation(patient, wb_history)

        # Create assessment document
        timestamp = datetime.utcnow().isoformat()
        assessment = {
            "patient_id": req.patient_id,
            "timestamp": timestamp,
            "day_post_delivery": day_post_delivery,
            "conversation_transcript": [
                {
                    "role": "assistant",
                    "message": result["message"],
                    "timestamp": timestamp,
                    "epds_question_mapped": None,
                    "epds_score_extracted": None
                }
            ],
            "epds_scores": {f"q{i}": 0 for i in range(1, 11)},
            "total_epds_score": 0,
            "risk_level": "low",
            "conversation_complete": False,
            "passive_signals": {},
            "flags": {
                "q10_triggered": False,
                "consecutive_low_mood": 0,
                "social_withdrawal": False,
                "doctor_notified": False,
                "family_notified": False
            }
        }
        conversation_id = await save_ppd_assessment(assessment)

        return {
            "message": result["message"],
            "conversation_id": conversation_id,
            "quick_replies": result.get("quick_replies", []),
            "crisis_flag": False
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ─── POST /ppd/respond ────────────────────────────────────────────────────────

@router.post("/ppd/respond")
async def respond_ppd(req: RespondRequest):
    try:
        from backend.db.queries import update_ppd_assessment
        from backend.engines.ppd_engine import PPDEngine

        engine = PPDEngine()
        result = await engine.process_response(
            patient_id=req.patient_id,
            user_message=req.message,
            conversation_history=req.conversation_history,
            current_epds=req.current_epds
        )

        # Append both turns to assessment
        timestamp = datetime.utcnow().isoformat()
        push_ops = {
            "conversation_transcript": {
                "$each": [
                    {"role": "user", "message": req.message, "timestamp": timestamp, "epds_question_mapped": None, "epds_score_extracted": None},
                    {"role": "assistant", "message": result["message"], "timestamp": timestamp, "epds_question_mapped": None, "epds_score_extracted": None}
                ]
            }
        }
        from backend.db.mongodb import ppd_assessments_collection
        from bson import ObjectId
        try:
            await ppd_assessments_collection.update_one(
                {"_id": ObjectId(req.conversation_id)},
                {"$push": push_ops}
            )
        except Exception:
            pass  # Non-critical transcript save

        return {
            "message": result["message"],
            "epds_updates": result.get("epds_updates", {}),
            "conversation_complete": result.get("conversation_complete", False),
            "crisis_flag": result.get("crisis_flag", False),
            "show_crisis_resources": result.get("show_crisis_resources", False),
            "quick_replies": result.get("quick_replies", [])
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ─── POST /ppd/complete ───────────────────────────────────────────────────────

@router.post("/ppd/complete")
async def complete_ppd(req: CompleteRequest):
    try:
        from backend.db.mongodb import users_collection
        from backend.db.queries import update_ppd_assessment, get_wellbeing_history
        from backend.engines.ppd_engine import PPDEngine
        from backend.engines.passive_ppd_detector import detect_passive_signals
        from backend.services.ppd_alert_service import handle_ppd_risk

        # Compute total EPDS
        total_epds = sum(req.epds_scores.get(f"q{i}", 0) for i in range(1, 11))
        q10_triggered = req.epds_scores.get("q10", 0) >= 3 or req.flags.get("q10_triggered", False)

        # Run passive detection
        passive = await detect_passive_signals(req.patient_id)

        engine = PPDEngine()
        risk_level = engine.calculate_risk_level(
            total_epds=total_epds,
            passive_signals=passive,
            consecutive_low_mood=passive.get("consecutive_low_mood", 0),
            q10_triggered=q10_triggered
        )

        # Fetch patient for name/doctor_id
        patient = await users_collection.find_one({"_id": req.patient_id})
        patient_name = patient.get("name", "Patient") if patient else "Patient"
        doctor_id = patient.get("doctor_id") if patient else None
        day_post_delivery = req.flags.get("day_post_delivery", 7)

        # Generate closing message
        closing = engine.generate_closing_message(risk_level, patient_name, day_post_delivery)

        # Save final assessment
        flags = {
            **req.flags,
            "q10_triggered": q10_triggered,
            "consecutive_low_mood": passive.get("consecutive_low_mood", 0),
            "social_withdrawal": passive.get("social_withdrawal", False),
            "doctor_notified": risk_level in ("high", "crisis"),
            "family_notified": risk_level == "crisis"
        }
        await update_ppd_assessment(req.conversation_id, {
            "epds_scores": req.epds_scores,
            "total_epds_score": total_epds,
            "risk_level": risk_level,
            "conversation_complete": True,
            "passive_signals": passive,
            "flags": flags
        })

        # Trigger alerts
        await handle_ppd_risk(
            patient_id=req.patient_id,
            risk_level=risk_level,
            flags=flags,
            patient_name=patient_name,
            doctor_id=doctor_id,
            epds_total=total_epds
        )

        return {
            "success": True,
            "closing_message": closing,
            "risk_level_shown_to_patient": engine.get_patient_facing_status(risk_level),
            "crisis_resources_needed": risk_level == "crisis" or q10_triggered
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ─── GET /ppd/should-show-full-chat/{patient_id} ─────────────────────────────

@router.get("/ppd/should-show-full-chat/{patient_id}")
async def should_show_full_chat(patient_id: str):
    try:
        from backend.db.queries import get_last_full_chat_date

        last_date_str = await get_last_full_chat_date(patient_id)
        if not last_date_str:
            return {"show_full_chat": True, "days_since_last": None}

        last_date = datetime.fromisoformat(last_date_str)
        days_since = (datetime.utcnow() - last_date).days
        return {
            "show_full_chat": days_since >= 3,
            "days_since_last": days_since
        }
    except Exception as e:
        return {"show_full_chat": True, "days_since_last": None}
