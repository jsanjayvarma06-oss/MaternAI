from fastapi import APIRouter, HTTPException
from backend.db.queries import get_doctor_patients, get_unread_alerts
from backend.db.mongodb import users_collection, analysis_results_collection, readings_collection

router = APIRouter()

@router.get("/{doctor_id}/dashboard")
async def get_doctor_dashboard(doctor_id: str):
    try:
        patients_list = await get_doctor_patients(doctor_id)
        alerts_list = await get_unread_alerts(doctor_id)

        # Enhance patient list with latest alert status
        for p in patients_list:
            p["_id"] = str(p["_id"])
            latest = await analysis_results_collection.find_one(
                {"patient_id": p["_id"]}, sort=[("timestamp", -1)]
            )
            if latest:
                p["latest_alert_level"] = latest.get("alert_level", "GREEN")
            else:
                p["latest_alert_level"] = "UNKNOWN"
        
        for a in alerts_list:
            a["_id"] = str(a["_id"])

        return {
            "patients": patients_list,
            "alerts": alerts_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patient/{patient_id}")
async def get_patient_details(patient_id: str):
    try:
        patient = await users_collection.find_one({"_id": patient_id})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient["_id"] = str(patient["_id"])

        history = await readings_collection.find({"patient_id": patient_id})\
             .sort("timestamp", -1).limit(7).to_list(length=7)
        for h in history:
            h["_id"] = str(h["_id"])

        latest = await analysis_results_collection.find_one(
            {"patient_id": patient_id}, sort=[("timestamp", -1)]
        )
        if latest:
            latest["_id"] = str(latest["_id"])

        return {
            "patient": patient,
            "history": history,
            "latest_analysis": latest
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
