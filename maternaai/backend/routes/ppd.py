from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from backend.engines.ppd_engine import PPDEngine
from backend.db.mongodb import ppd_assessments_collection, users_collection
from backend.services.ppd_alert_service import handle_ppd_risk
from backend.engines.passive_ppd_detector import detect_passive_signals

router = APIRouter(prefix="/ppd", tags=["ppd"])
ppd_engine = PPDEngine()

class StartRequest(BaseModel):
    patient_id: str

class StartResponse(BaseModel):
    message: str
    conversation_id: str
    quick_replies: List[str]

class RespondRequest(BaseModel):
    conversation_id: str
    patient_id: str
    message: str

class RespondResponse(BaseModel):
    message: str
    conversation_complete: bool
    crisis_flag: bool
    quick_replies: List[str]

@router.post("/start", response_model=StartResponse)
async def start_ppd_chat(req: StartRequest):
    patient = await users_collection.find_one({"_id": req.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get last assessment for context if needed
    history = await ppd_assessments_collection.find(
        {"patient_id": req.patient_id}
    ).sort("timestamp", -1).to_list(length=1)
    
    result = await ppd_engine.start_conversation(patient, history)
    
    # Create initial shell in DB
    assessment = {
        "patient_id": req.patient_id,
        "timestamp": datetime.now().isoformat(),
        "day_post_delivery": patient.get("day_post_delivery", 1),
        "conversation_transcript": [
            {
                "role": "assistant",
                "message": result["patient_message"],
                "timestamp": datetime.now().isoformat()
            }
        ],
        "epds_scores": {},
        "total_epds_score": 0,
        "risk_level": "low",
        "flags": {"q10_triggered": False},
        "status": "in_progress"
    }
    insert_result = await ppd_assessments_collection.insert_one(assessment)
    
    return {
        "message": result["patient_message"],
        "conversation_id": str(insert_result.inserted_id),
        "quick_replies": ["I'm okay", "A bit tired", "Feeling good"]
    }

@router.post("/respond", response_model=RespondResponse)
async def process_user_message(req: RespondRequest):
    # Retrieve conversation
    from bson import ObjectId
    assessment = await ppd_assessments_collection.find_one({"_id": ObjectId(req.conversation_id)})
    if not assessment:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    history = assessment.get("conversation_transcript", [])
    current_epds = assessment.get("epds_scores", {})
    
    # Process with engine
    result = await ppd_engine.process_response(
        req.patient_id,
        req.message,
        history,
        current_epds
    )
    
    # Update assessment in DB
    new_user_turn = {
        "role": "user",
        "message": req.message,
        "timestamp": datetime.now().isoformat()
    }
    new_assistant_turn = {
        "role": "assistant",
        "message": result["patient_message"],
        "timestamp": datetime.now().isoformat()
    }
    
    # Merge EPDS scores
    updated_epds = {**current_epds, **result.get("epds_updates", {})}
    total_score = sum(updated_epds.values())
    
    await ppd_assessments_collection.update_one(
        {"_id": ObjectId(req.conversation_id)},
        {
            "$push": {"conversation_transcript": {"$each": [new_user_turn, new_assistant_turn]}},
            "$set": {
                "epds_scores": updated_epds,
                "total_epds_score": total_score,
                "flags.q10_triggered": result.get("crisis_flag", False)
            }
        }
    )
    
    return {
        "message": result["patient_message"],
        "conversation_complete": result.get("conversation_complete", False),
        "crisis_flag": result.get("crisis_flag", False),
        "quick_replies": [] # Dynamic replies could be added here
    }

@router.post("/complete")
async def complete_ppd_chat(req: StartRequest, background_tasks: BackgroundTasks):
    assessment = await ppd_assessments_collection.find(
        {"patient_id": req.patient_id}
    ).sort("timestamp", -1).to_list(length=1)
    
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found")
    
    assessment = assessment[0]
    total_score = assessment.get("total_epds_score", 0)
    
    # Run passive detector
    passive_results = await detect_passive_signals(req.patient_id)
    
    # Calculate final risk level
    risk_level = ppd_engine.calculate_risk_level(
        total_score,
        passive_results,
        passive_results.get("consecutive_low_mood", 0)
    )
    
    # Handle risks and alerts
    background_tasks.add_task(
        handle_ppd_risk,
        req.patient_id,
        risk_level,
        assessment.get("flags", {}),
        total_score
    )
    
    # Update final record
    await ppd_assessments_collection.update_one(
        {"_id": assessment["_id"]},
        {
            "$set": {
                "risk_level": risk_level,
                "passive_signals": passive_results,
                "status": "completed"
            }
        }
    )
    
    # For frontend, return a warm confirmation
    # (Actual risk level is hidden from patient)
    return {"risk_level_shown_to_patient": "Thank you for sharing with me today."}

@router.get("/should-show-full-chat/{patient_id}")
async def should_show_full_chat(patient_id: str):
    last_chat = await ppd_assessments_collection.find_one(
        {"patient_id": patient_id, "status": "completed"},
        sort=[("timestamp", -1)]
    )
    
    if not last_chat:
        return {"show_full_chat": True}
        
    last_ts = datetime.fromisoformat(last_chat["timestamp"])
    days_since = (datetime.now() - last_ts).days
    
    return {"show_full_chat": days_since >= 3}
