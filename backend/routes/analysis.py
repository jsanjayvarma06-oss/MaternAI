from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from backend.models.patient import (
    PatientData, VitalsReading, SymptomsReport, WoundAssessment, AnalysisResult
)
from backend.engines.risk_engine import calculate_risk_scores
from backend.engines.alert_engine import generate_alert
from backend.engines.wound_analyzer import analyse_wound_photo
from backend.services.alert_service import notify_doctor

import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firestore
if not firebase_admin._apps:
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
    except Exception:
        # Fallback for dev purposes if no credentials are provided
        firebase_admin.initialize_app()

db = firestore.client()

router = APIRouter()

class AnalyseRequest(BaseModel):
    patient_id: str
    patient_data: PatientData
    vitals: VitalsReading
    symptoms: SymptomsReport
    wound: Optional[WoundAssessment] = None
    wound_photo: Optional[str] = None # Base64 encoded image

@router.post("/analyse", response_model=AnalysisResult)
async def analyse_patient_reading(request: AnalyseRequest, background_tasks: BackgroundTasks):
    try:
        # Fetch history from Firebase
        history_ref = db.collection("readings").where("patientId", "==", request.patient_id)\
                        .order_by("timestamp", direction=firestore.Query.DESCENDING).limit(10).stream()
        
        history = []
        for doc in history_ref:
            history.append(VitalsReading(**doc.to_dict()))
        
        # Risk scores calculation
        wound = request.wound or WoundAssessment(applicable=False)

        # If wound photo exists, AI engine is called
        if request.wound_photo:
            wound = await analyse_wound_photo(request.wound_photo, request.patient_data.day_post_delivery)
        else:
            wound = request.wound or WoundAssessment(applicable=False)

        risk_scores = calculate_risk_scores(
            vitals=request.vitals,
            symptoms=request.symptoms,
            wound=wound,
            patient_data=request.patient_data,
            history=history
        )

        alert_data = generate_alert(risk_scores, request.patient_data)

        # Notify doctor if RED
        if alert_data["doctor_notification"]:
            background_tasks.add_task(notify_doctor, request.patient_id, risk_scores, request.vitals)

        # Save the reading and result asynchronously
        reading_doc = {
            "patientId": request.patient_id,
            "vitals": request.vitals.model_dump(),
            "symptoms": request.symptoms.model_dump(),
            "wound": wound.model_dump() if wound else None,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "risk_scores": risk_scores.model_dump(),
            "alert_level": alert_data["alert_level"]
        }
        
        background_tasks.add_task(db.collection("readings").add, reading_doc)
        
        return AnalysisResult(
            risk_scores=risk_scores,
            alert_level=alert_data["alert_level"],
            patient_message=alert_data["patient_message"],
            recommended_action=alert_data["recommended_action"],
            doctor_notification=alert_data["doctor_notification"],
            urgency=alert_data["urgency"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patient/{patient_id}/history", response_model=List[VitalsReading])
def get_patient_history(patient_id: str, days: int = 7):
    # Retrieve last `days` readings
    try:
        docs = db.collection("readings").where("patientId", "==", patient_id)\
                 .order_by("timestamp", direction=firestore.Query.DESCENDING).limit(days).stream()
        
        history = [VitalsReading(**d.to_dict()["vitals"]) for d in docs]
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/patient/{patient_id}/reading")
def save_reading(patient_id: str, vitals: VitalsReading):
    try:
        db.collection("readings").add({
            "patientId": patient_id,
            "vitals": vitals.model_dump(),
            "timestamp": firestore.SERVER_TIMESTAMP
        })
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
