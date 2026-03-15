import pytest
from backend.models.patient import VitalsReading, SymptomsReport, WoundAssessment, PatientData, RiskScores
from backend.engines.risk_engine import calculate_risk_scores

@pytest.fixture
def base_patient():
    return PatientData(
        name="Test Patient",
        age=30,
        delivery_type="vaginal",
        delivery_date="2026-03-01",
        day_post_delivery=5,
        risk_factors=[]
    )

@pytest.fixture
def base_vitals():
    return VitalsReading(
        systolic=120,
        diastolic=80,
        heart_rate=75,
        temperature=37.0,
        spo2=98,
        weight_kg=65.0,
        timestamp="2026-03-06"
    )

@pytest.fixture
def base_symptoms():
    return SymptomsReport(
        bleeding_level="none",
        pain_level=2,
        headache=False,
        visual_disturbance=False,
        leg_swelling=False,
        shortness_of_breath=False
    )

@pytest.fixture
def base_wound():
    return WoundAssessment(applicable=False)

def test_normal_readings(base_patient, base_vitals, base_symptoms, base_wound):
    scores = calculate_risk_scores(base_vitals, base_symptoms, base_wound, base_patient, [])
    # Baseline blood clot score is 10 for day <= 42
    assert scores.preeclampsia == 0
    assert scores.hemorrhage == 0
    assert scores.blood_clot == 10
    assert scores.wound_infection == 0

def test_elevated_bp_preeclampsia(base_patient, base_vitals, base_symptoms, base_wound):
    base_vitals.systolic = 145
    base_vitals.diastolic = 95
    scores = calculate_risk_scores(base_vitals, base_symptoms, base_wound, base_patient, [])
    assert scores.preeclampsia == 40
    
def test_heavy_bleeding_hemorrhage(base_patient, base_vitals, base_symptoms, base_wound):
    base_symptoms.bleeding_level = "heavy"
    scores = calculate_risk_scores(base_vitals, base_symptoms, base_wound, base_patient, [])
    assert scores.hemorrhage == 40

def test_clots_pulse_hemorrhage(base_patient, base_vitals, base_symptoms, base_wound):
    base_symptoms.bleeding_level = "clots"
    base_vitals.heart_rate = 105
    scores = calculate_risk_scores(base_vitals, base_symptoms, base_wound, base_patient, [])
    assert scores.hemorrhage == 80  # 60 (clots) + 20 (hr > 100)

def test_leg_swelling_low_spo2_blood_clot(base_patient, base_vitals, base_symptoms, base_wound):
    base_symptoms.leg_swelling = True
    base_vitals.spo2 = 92
    scores = calculate_risk_scores(base_vitals, base_symptoms, base_wound, base_patient, [])
    # 10 (baseline) + 35 (swelling) + 35 (spo2 < 94)
    assert scores.blood_clot == 80

def test_c_section_wound_emergency(base_patient, base_vitals, base_symptoms, base_wound):
    base_patient.delivery_type = "c-section"
    base_wound.applicable = True
    base_wound.photo_score = "emergency"
    
    scores = calculate_risk_scores(base_vitals, base_symptoms, base_wound, base_patient, [])
    assert scores.wound_infection == 80
    
    # Vaginal should ignore wound score
    base_patient.delivery_type = "vaginal"
    scores_vaginal = calculate_risk_scores(base_vitals, base_symptoms, base_wound, base_patient, [])
    assert scores_vaginal.wound_infection == 0

def test_score_caps(base_patient, base_vitals, base_symptoms, base_wound):
    # Ensure scores don't exceed 100
    base_vitals.systolic = 150 # +40
    base_symptoms.headache = True # +20
    base_symptoms.visual_disturbance = True # +20
    
    # Trend simulating 4 days of rising BP
    history = [
        VitalsReading(systolic=110, diastolic=70, heart_rate=75, temperature=37.0, spo2=98, weight_kg=65.0, timestamp="1"),
        VitalsReading(systolic=120, diastolic=75, heart_rate=75, temperature=37.0, spo2=98, weight_kg=65.0, timestamp="2"),
        VitalsReading(systolic=130, diastolic=80, heart_rate=75, temperature=37.0, spo2=98, weight_kg=65.0, timestamp="3")
    ]
    
    scores = calculate_risk_scores(base_vitals, base_symptoms, base_wound, base_patient, history)
    # Expected preeclampsia: 40 + 20 + 20 + 20 (trend) = 100. Should be capped at 100.
    assert scores.preeclampsia == 100
