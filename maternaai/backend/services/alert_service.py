from backend.models.patient import RiskScores, VitalsReading
from backend.routes.analysis import db # Re-use the firestore client
import firebase_admin.firestore as firestore
import uuid
from datetime import datetime

async def notify_doctor(patient_id: str, risk_scores: RiskScores, vitals: VitalsReading):
    try:
        # 1. Fetch patient record to get doctor_id
        patient_ref = db.collection("patients").document(patient_id).get()
        if not patient_ref.exists:
            print(f"Patient {patient_id} not found, cannot notify doctor.")
            doctor_id = "unknown_doctor"
            patient_name = "Unknown Patient"
            day_post_delivery = "Unknown"
            age = "Unknown"
        else:
            p_data = patient_ref.to_dict()
            doctor_id = p_data.get("doctorId", "unknown_doctor")
            patient_name = p_data.get("name", "Unknown Patient")
            day_post_delivery = p_data.get("day_post_delivery", "Unknown")
            age = p_data.get("age", "Unknown")

        # Determine triggered condition
        highest_score = max(
            risk_scores.preeclampsia,
            risk_scores.hemorrhage,
            risk_scores.blood_clot,
            risk_scores.wound_infection
        )
        scores_map = {
            "Preeclampsia": risk_scores.preeclampsia,
            "Hemorrhage": risk_scores.hemorrhage,
            "Blood Clot": risk_scores.blood_clot,
            "Wound Infection": risk_scores.wound_infection
        }
        triggered_by = [k for k, v in scores_map.items() if v == highest_score][0]

        # 2. Generate clinical summary
        clinical_summary = (
            f"URGENT: {patient_name}, {age}yo, day {day_post_delivery} postpartum. "
            f"Triggered RED alert for {triggered_by}. "
            f"Current Vitals -> BP: {vitals.systolic}/{vitals.diastolic}, "
            f"HR: {vitals.heart_rate}, Temp: {vitals.temperature}°C, SpO2: {vitals.spo2}%. "
            f"Recommended immediate follow-up or emergency referral."
        )

        alert_id = str(uuid.uuid4())
        
        # 3. Write alert to Firestore
        alert_doc = {
            "alert_id": alert_id,
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "patient_name": patient_name,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "alert_level": "RED",
            "triggered_by": triggered_by,
            "risk_scores": risk_scores.model_dump(),
            "clinical_summary": clinical_summary,
            "status": "unread"
        }
        
        db.collection("alerts").document(alert_id).set(alert_doc)
        return alert_id
    except Exception as e:
        print(f"Error in notify_doctor: {e}")
        return None
