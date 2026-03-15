from pydantic import BaseModel, Field
from typing import Optional

class PatientData(BaseModel):
    name: str
    age: int
    delivery_type: str  # "vaginal" or "c-section"
    delivery_date: str
    day_post_delivery: int
    risk_factors: list[str] = []

class VitalsReading(BaseModel):
    systolic: int
    diastolic: int
    heart_rate: int
    temperature: float
    spo2: int
    weight_kg: float
    timestamp: Optional[str] = None

class SymptomsReport(BaseModel):
    bleeding_level: str  # "none", "light", "moderate", "heavy", "clots"
    pain_level: int      # 0 to 10
    headache: bool
    visual_disturbance: bool
    leg_swelling: bool
    shortness_of_breath: bool

class WoundAssessment(BaseModel):
    applicable: bool
    photo_score: Optional[str] = None # "healing_well", "monitor", "see_doctor", "emergency"
    redness: Optional[str] = None     # "none", "mild", "moderate", "severe"
    discharge: Optional[str] = None   # "none", "serous", "purulent"
    swelling: Optional[str] = None    # "none", "mild", "significant"
    edges: Optional[str] = None       # "intact", "slightly_separated", "gaping"
    patient_explanation: Optional[str] = None

class RiskScores(BaseModel):
    preeclampsia: int = Field(ge=0, le=100)
    hemorrhage: int = Field(ge=0, le=100)
    blood_clot: int = Field(ge=0, le=100)
    wound_infection: int = Field(ge=0, le=100)

class AnalysisResult(BaseModel):
    risk_scores: RiskScores
    alert_level: str  # "GREEN", "YELLOW", "RED"
    patient_message: str
    recommended_action: str
    doctor_notification: bool
    urgency: str
