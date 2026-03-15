from backend.models.patient import RiskScores, PatientData, VitalsReading

def generate_alert(risk_scores: RiskScores, patient_data: PatientData) -> dict:
    highest_score = max(
        risk_scores.preeclampsia,
        risk_scores.hemorrhage,
        risk_scores.blood_clot,
        risk_scores.wound_infection
    )

    if highest_score >= 70:
        alert_level = "RED"
        patient_message = "Your readings indicate some critical signs. We have notified your doctor immediately. Please sit down and try to remain calm."
        recommended_action = "Wait for your doctor's call or proceed to the nearest emergency room if symptoms worsen."
        doctor_notification = True
        urgency = "immediate"
    elif highest_score >= 30:
        alert_level = "YELLOW"
        patient_message = "Some of your vitals or symptoms are slightly elevated. It's nothing to panic about, but please monitor them closely."
        recommended_action = "Drink plenty of fluids, rest, and complete another check-in in 4 hours."
        doctor_notification = False
        urgency = "monitor"
    else:
        alert_level = "GREEN"
        patient_message = "Your readings look great today! You are recovering well."
        recommended_action = "Continue resting and maintain your daily check-ins."
        doctor_notification = False
        urgency = "normal"

    return {
        "alert_level": alert_level,
        "patient_message": patient_message,
        "recommended_action": recommended_action,
        "doctor_notification": doctor_notification,
        "urgency": urgency
    }
