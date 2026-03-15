"""
Engine 2 — PPD Alert Service
Routes CRISIS/HIGH/MODERATE/LOW risk to appropriate MongoDB alerts.
"""
from datetime import datetime
from typing import Optional


async def handle_ppd_risk(
    patient_id: str,
    risk_level: str,
    flags: dict,
    patient_name: str = "Patient",
    doctor_id: Optional[str] = None,
    epds_total: int = 0
):
    from backend.db.mongodb import alerts_collection, users_collection

    timestamp = datetime.utcnow().isoformat()
    result = {"alerts_created": [], "crisis_resources_shown": False}

    if risk_level == "crisis" or flags.get("q10_triggered"):
        # CRISIS: immediate RED alert, show resources
        alert = {
            "doctor_id": doctor_id,
            "patient_id": patient_id,
            "patient_name": patient_name,
            "status": "unread",
            "timestamp": timestamp,
            "alert_level": "PPD_CRISIS",
            "urgency": "immediate",
            "clinical_summary": (
                f"CRISIS flag triggered. Patient may be at immediate risk. "
                f"Q10 triggered: {flags.get('q10_triggered', False)}. "
                f"Immediate contact required."
            ),
            "q10_triggered": flags.get("q10_triggered", False),
            "epds_total": epds_total,
        }
        if doctor_id:
            await alerts_collection.insert_one(alert)
        result["alerts_created"].append("PPD_CRISIS")
        result["crisis_resources_shown"] = True

    elif risk_level == "high":
        # HIGH: amber alert, urgency=today
        alert = {
            "doctor_id": doctor_id,
            "patient_id": patient_id,
            "patient_name": patient_name,
            "status": "unread",
            "timestamp": timestamp,
            "alert_level": "PPD_HIGH",
            "urgency": "today",
            "clinical_summary": (
                f"EPDS total score: {epds_total} (threshold for clinical concern: 12). "
                f"Consecutive low mood days: {flags.get('consecutive_low_mood', 0)}. "
                f"Social withdrawal: {flags.get('social_withdrawal', False)}. "
                "Follow-up recommended today."
            ),
            "epds_total": epds_total,
        }
        if doctor_id:
            await alerts_collection.insert_one(alert)
        result["alerts_created"].append("PPD_HIGH")

    elif risk_level == "moderate":
        # MODERATE: log in analysis_results, amber badge — no imperative alert
        from backend.db.mongodb import analysis_results_collection
        await analysis_results_collection.update_one(
            {"patient_id": patient_id},
            {"$set": {
                "ppd_moderate_flag": True,
                "ppd_epds_total": epds_total,
                "ppd_timestamp": timestamp
            }},
            sort=[("timestamp", -1)]
        )
        result["alerts_created"].append("PPD_MODERATE_FLAG")

    # LOW: log only — no alert
    return result
