from backend.models.patient import VitalsReading, SymptomsReport, WoundAssessment, PatientData, RiskScores

def calculate_risk_scores(
    vitals: VitalsReading,
    symptoms: SymptomsReport,
    wound: WoundAssessment,
    day_post_delivery: int,
    delivery_type: str,
    history: list[dict] # raw dicts from mongodb
) -> RiskScores:
    preeclampsia = 0
    hemorrhage = 0
    blood_clot = 0
    wound_infection = 0
    ppd = 0

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
    if len(history) >= 3:
        # Assuming history is sorted oldest to newest for trend check or newest first.
        # "BP rising trend 3+ days (from MongoDB history): +20"
        recent = sorted(history, key=lambda x: x["timestamp"])[-3:]
        is_rising = True
        pt = recent[0]["vitals"]
        for r in recent[1:]:
            curr = r["vitals"]
            if curr["systolic"] <= pt["systolic"] and curr["diastolic"] <= pt["diastolic"]:
                is_rising = False
                break
            pt = curr
        if is_rising and (vitals.systolic > pt["systolic"] or vitals.diastolic > pt["diastolic"]):
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
    if day_post_delivery <= 42:
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
    if delivery_type.lower() == "c-section" and wound and wound.applicable:
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

    # 5. PPD Risk
    if symptoms.mood_score <= 2:
        ppd += 25
        # Check 3 consecutive days
        if len(history) >= 2:
            recent_2 = sorted(history, key=lambda x: x["timestamp"])[-2:]
            low_mood_streak = True
            for r in recent_2:
                if r.get("symptoms", {}).get("mood_score", 5) > 2:
                    low_mood_streak = False
                    break
            if low_mood_streak:
                ppd += 50

    if symptoms.extreme_fatigue:  # Boolean fallback since frontend just uses yes/no extreme_fatigue
        ppd += 15

    # Cap all scores at 100
    preeclampsia = min(preeclampsia, 100)
    hemorrhage = min(hemorrhage, 100)
    blood_clot = min(blood_clot, 100)
    wound_infection = min(wound_infection, 100)
    ppd = min(ppd, 100)

    return RiskScores(
        preeclampsia=preeclampsia,
        hemorrhage=hemorrhage,
        blood_clot=blood_clot,
        wound_infection=wound_infection,
        ppd=ppd
    )
