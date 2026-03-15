from datetime import datetime
from backend.db.mongodb import alerts_collection, users_collection

async def handle_ppd_risk(
    patient_id: str,
    risk_level: str,
    flags: dict,
    epds_total: int = 0
):
    """
    risk_level: "low", "moderate", "high", "crisis"
    flags: { "q10_triggered": bool, ... }
    """
    
    # Get patient info for context
    patient = await users_collection.find_one({"id": patient_id})
    patient_name = patient.get("name", "Patient") if patient else "Patient"
    doctor_id = patient.get("doctor_id") if patient else None

    # CRISIS (Q10 triggered)
    if risk_level == "crisis" or flags.get("q10_triggered"):
        # Create CRISIS alert
        alert = {
            "patient_id": patient_id,
            "patient_name": patient_name,
            "doctor_id": doctor_id,
            "type": "PPD_CRISIS",
            "urgency": "immediate",
            "status": "active",
            "timestamp": datetime.now().isoformat(),
            "message": f"CRITICAL: Emergency PPD attention required for {patient_name}. Self-harm signals detected.",
            "metadata": {
                "epds_score": epds_total,
                "q10_triggered": True,
                "flags": flags
            }
        }
        await alerts_collection.insert_one(alert)
        # In a real app, send SMS/Email/Push here
        print(f"CRISIS NOTIFICATION SENT FOR {patient_id}")

    # HIGH
    elif risk_level == "high":
        alert = {
            "patient_id": patient_id,
            "patient_name": patient_name,
            "doctor_id": doctor_id,
            "type": "PPD_HIGH",
            "urgency": "today",
            "status": "unread",
            "timestamp": datetime.now().isoformat(),
            "message": f"High PPD risk detected for {patient_name}. EPDS Score: {epds_total}. Recommend clinical follow-up today.",
            "metadata": {
                "epds_score": epds_total,
                "flags": flags
            }
        }
        await alerts_collection.insert_one(alert)

    # MODERATE
    elif risk_level == "moderate":
        alert = {
            "patient_id": patient_id,
            "patient_name": patient_name,
            "doctor_id": doctor_id,
            "type": "PPD_MODERATE",
            "urgency": "low",
            "status": "unread",
            "timestamp": datetime.now().isoformat(),
            "message": f"Moderate PPD risk for {patient_name}. EPDS Score: {epds_total}. Monitor closely.",
            "metadata": {
                "epds_score": epds_total,
                "flags": flags
            }
        }
        await alerts_collection.insert_one(alert)

    # LOW
    else:
        # Just log for data/trends, no immediate alert needed
        pass

    return True
