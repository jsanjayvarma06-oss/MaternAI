from backend.models.patient import VitalsReading, SymptomsReport, WoundAssessment, PatientData, RiskScores

def calculate_risk_scores(
    vitals: VitalsReading,
    symptoms: SymptomsReport,
    wound: WoundAssessment,
    patient_data: PatientData,
    history: list[VitalsReading]
) -> RiskScores:
    preeclampsia = 0
    hemorrhage = 0
    blood_clot = 0
    wound_infection = 0

    # 1. Preeclampsia Scoring
    if vitals.systolic >= 140 or vitals.diastolic >= 90:
        preeclampsia += 40
    elif (130 <= vitals.systolic <= 139) or (85 <= vitals.diastolic <= 89):
        preeclampsia += 20
    
    if symptoms.headache:
        preeclampsia += 20
    if symptoms.visual_disturbance:
        preeclampsia += 20

    # BP rising trend 3+ consecutive days
    # Need at least 3 historical readings to evaluate a trend
    if len(history) >= 3:
        # Check if the last 3 days had increasing systolic or diastolic compared to the previous day
        bp_rising = True
        recent_history = sorted(history, key=lambda x: x.timestamp or "")[-3:]
        prev_sys = recent_history[0].systolic
        prev_dia = recent_history[0].diastolic
        for reading in recent_history[1:]:
            if reading.systolic <= prev_sys and reading.diastolic <= prev_dia:
                bp_rising = False
                break
            prev_sys = reading.systolic
            prev_dia = reading.diastolic
        
        # also compare latest to current
        if bp_rising and (vitals.systolic > prev_sys or vitals.diastolic > prev_dia):
            preeclampsia += 20

    # 2. Hemorrhage Scoring
    if symptoms.bleeding_level == "clots":
        hemorrhage += 60
    elif symptoms.bleeding_level == "heavy":
        hemorrhage += 40
    elif symptoms.bleeding_level == "moderate":
        hemorrhage += 20

    if vitals.heart_rate > 100:
        hemorrhage += 20
    if symptoms.pain_level > 7:
        hemorrhage += 15

    # 3. Blood Clot Scoring
    if patient_data.day_post_delivery <= 42:
        blood_clot += 10
    
    if symptoms.leg_swelling:
        blood_clot += 35
    if symptoms.shortness_of_breath:
        blood_clot += 25
    if vitals.spo2 < 94:
        blood_clot += 35
    if vitals.heart_rate > 100 and vitals.temperature < 37.5:
        blood_clot += 15

    # 4. Wound Infection Scoring (C-section only)
    if patient_data.delivery_type.lower() == "c-section":
        if wound.photo_score == "emergency":
            wound_infection += 80
        elif wound.photo_score == "see_doctor":
            wound_infection += 50
        
        if vitals.temperature >= 38.0:
            wound_infection += 35
        elif 37.8 <= vitals.temperature <= 37.9:
            wound_infection += 15
        
        if symptoms.pain_level > 5:
            wound_infection += 15

    # Cap all scores at 100
    preeclampsia = min(preeclampsia, 100)
    hemorrhage = min(hemorrhage, 100)
    blood_clot = min(blood_clot, 100)
    wound_infection = min(wound_infection, 100)

    return RiskScores(
        preeclampsia=preeclampsia,
        hemorrhage=hemorrhage,
        blood_clot=blood_clot,
        wound_infection=wound_infection
    )
