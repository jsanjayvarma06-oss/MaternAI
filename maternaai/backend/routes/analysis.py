from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from backend.models.patient import (
    VitalsReading, SymptomsReport, WoundAssessment, AnalysisResult,
    WeeklyInsightsRequest, WeeklyInsightResult, RiskScores
)
from backend.engines.risk_engine import calculate_risk_scores
from backend.engines.gemini_engine import generate_clinical_insight
from backend.engines.insight_engine import generate_weekly_insight
from backend.db.mongodb import users_collection, readings_collection, analysis_results_collection, alerts_collection

router = APIRouter()

class ReadingRequest(BaseModel):
    patient_id: str
    vitals: VitalsReading
    symptoms: SymptomsReport
    wound: WoundAssessment

def get_alert_level(risk_scores: RiskScores) -> str:
    scores = risk_scores.model_dump().values()
    if any(s >= 70 for s in scores):
        return "RED"
    elif any(30 <= s <= 69 for s in scores):
        return "YELLOW"
    return "GREEN"

from fastapi import status, Response

@router.post("/readings", status_code=status.HTTP_201_CREATED)
async def submit_reading(req: ReadingRequest, background_tasks: BackgroundTasks):
    try:
        # 1. Fetch patient profile for delivery context
        patient = await users_collection.find_one({"_id": req.patient_id})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        # Calculate day post delivery
        birthdate = datetime.fromisoformat(patient["child_birthdate"])
        day_post_delivery = (datetime.utcnow() - birthdate).days
        day_post_delivery = max(0, day_post_delivery) # Enforce >= 0
        delivery_type = patient.get("delivery_type", "vaginal")
        doctor_id = patient.get("doctor_id")

        # 2. Extract 7-day history for trend analysis
        history_cursor = readings_collection.find({"patient_id": req.patient_id}).sort("timestamp", -1).limit(7)
        history_docs = await history_cursor.to_list(length=7)

        # 3. Calculate explicit Risk Rubric Scores
        risk_scores = calculate_risk_scores(
            vitals=req.vitals,
            symptoms=req.symptoms,
            wound=req.wound,
            day_post_delivery=day_post_delivery,
            delivery_type=delivery_type,
            history=history_docs
        )

        alert_level = get_alert_level(risk_scores)

        # 4. Save the reading to MongoDB
        timestamp = datetime.utcnow().isoformat()
        reading_doc = {
            "patient_id": req.patient_id,
            "day_post_delivery": day_post_delivery,
            "timestamp": timestamp,
            "vitals": req.vitals.model_dump(),
            "symptoms": req.symptoms.model_dump(),
            "wound": req.wound.model_dump()
        }
        res = await readings_collection.insert_one(reading_doc)
        reading_id = str(res.inserted_id)

        # 5. Gemini AI Clinical Analysis
        clinical_data = await generate_clinical_insight(reading=reading_doc, history=history_docs)

        # 6. Save Analysis Result to MongoDB
        analysis_doc = {
            "reading_id": reading_id,
            "patient_id": req.patient_id,
            "timestamp": timestamp,
            "risk_scores": risk_scores.model_dump(),
            "alert_level": alert_level,
            "patient_message": clinical_data.get("patient_message", ""),
            "recommended_action": clinical_data.get("recommended_action", ""),
            "doctor_notified": clinical_data.get("doctor_notification", {}).get("required", False),
            "insights": clinical_data.get("insights", [])
        }
        await analysis_results_collection.insert_one(analysis_doc)

        # 7. Create Alert for Doctor if Red
        if alert_level == "RED" and doctor_id:
            alert_doc = {
                "doctor_id": doctor_id,
                "patient_id": req.patient_id,
                "patient_name": patient.get("name"),
                "reading_id": reading_id,
                "status": "unread",
                "timestamp": timestamp,
                "clinical_summary": clinical_data.get("doctor_notification", {}).get("summary", ""),
                "alert_level": alert_level
            }
            background_tasks.add_task(alerts_collection.insert_one, alert_doc)

        # Return exact model
        analysis_res = AnalysisResult(
            risk_scores=risk_scores,
            alert_level=alert_level,
            patient_message=analysis_doc["patient_message"],
            recommended_action=analysis_doc["recommended_action"],
            doctor_notification=analysis_doc["doctor_notified"],
            urgency=clinical_data.get("doctor_notification", {}).get("urgency", "low")
        )

        return {
            "success": True,
            "reading_id": reading_id,
            "analysis": analysis_res.model_dump()
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(content='{"success": false, "error": "Failed to save reading"}', status_code=500, media_type="application/json")

@router.get("/patient/{patient_id}/history")
async def get_patient_history(patient_id: str, days: int = 7):
    # Used for Dashboard
    try:
        docs = await readings_collection.find({"patient_id": patient_id})\
                 .sort("timestamp", -1).limit(days).to_list(length=days)
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/insights/weekly", response_model=WeeklyInsightResult)
async def get_weekly_insight(request: WeeklyInsightsRequest):
    try:
        insight = await generate_weekly_insight(request)
        return WeeklyInsightResult(insight=insight)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/{patient_id}")
async def get_patient_dashboard(patient_id: str):
    try:
        patient = await users_collection.find_one({"_id": patient_id})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Latest analysis
        latest_analysis = await analysis_results_collection.find_one(
            {"patient_id": patient_id},
            sort=[("timestamp", -1)]
        )

        # 7 Day History
        history = await readings_collection.find({"patient_id": patient_id})\
                 .sort("timestamp", -1).limit(7).to_list(length=7)
        
        # Serialize _id
        if patient.get("_id"):
            patient["_id"] = str(patient["_id"])
        if latest_analysis and latest_analysis.get("_id"):
            latest_analysis["_id"] = str(latest_analysis["_id"])
            latest_analysis["reading_id"] = str(latest_analysis["reading_id"])
        for h in history:
            h["_id"] = str(h["_id"])

        # Check for today's reading
        today = datetime.utcnow()
        start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        end_of_day = today.replace(hour=23, minute=59, second=59, microsecond=999999).isoformat()
        
        todays_reading = await readings_collection.find_one({
            "patient_id": patient_id,
            "timestamp": {
                "$gte": start_of_day,
                "$lte": end_of_day
            }
        })

        return {
            "patient": patient,
            "latest_analysis": latest_analysis,
            "history": history,
            "has_todays_reading": bool(todays_reading)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
