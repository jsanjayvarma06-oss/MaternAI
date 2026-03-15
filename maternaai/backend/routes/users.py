from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Union
from datetime import datetime
from backend.db.mongodb import users_collection, readings_collection
from backend.models.user import PatientProfile, DoctorProfile
from datetime import datetime, date

router = APIRouter()

class RegisterRequest(BaseModel):
    uid: str
    role: str
    name: str
    # Patient fields
    age: int = None
    child_birthdate: str = None
    delivery_type: str = None
    doctor_id: str = None
    # Doctor fields
    hospital: str = None
    specialization: str = None

@router.post("/register")
async def register_user(req: RegisterRequest):
    try:
        doc = req.dict(exclude_none=True)
        doc["_id"] = req.uid  # Map Firebase UID to MongoDB _id
        doc["created_at"] = datetime.utcnow().isoformat()
        
        # Check if exists
        existing = await users_collection.find_one({"_id": req.uid})
        if existing:
            return {"status": "User already exists", "_id": req.uid}

        result = await users_collection.insert_one(doc)
        return {"status": "success", "_id": req.uid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{uid}")
async def get_user_status(uid: str):
    try:
        user = await users_collection.find_one({"_id": uid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        role = user.get("role")
        has_checked_in_today = False
        
        if role == "patient":
            # FIX 2: Use date range instead of timestamp regex to correctly compare dates
            today = datetime.utcnow()
            start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
            end_of_day = today.replace(hour=23, minute=59, second=59, microsecond=999999).isoformat()

            reading = await readings_collection.find_one({
                "patient_id": uid,
                "timestamp": {
                    "$gte": start_of_day,
                    "$lte": end_of_day
                }
            })
            if reading:
                has_checked_in_today = True
                
        return {"role": role, "has_checked_in_today": has_checked_in_today}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
