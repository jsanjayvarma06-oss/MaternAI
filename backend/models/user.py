from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    uid: str
    role: str
    name: str

class PatientProfile(UserBase):
    age: int
    child_birthdate: str # ISO8601 string
    delivery_type: str
    doctor_id: Optional[str] = None

class DoctorProfile(UserBase):
    hospital: str
    specialization: str
