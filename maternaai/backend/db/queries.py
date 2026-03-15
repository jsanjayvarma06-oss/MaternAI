from backend.db.mongodb import (
    users_collection,
    readings_collection,
    analysis_results_collection,
    alerts_collection,
    wellbeing_logs_collection
)
from datetime import datetime
import pymongo

async def get_patient_history(patient_id: str, days: int = 7):
    cursor = readings_collection.find({"patient_id": patient_id}).sort("timestamp", pymongo.DESCENDING).limit(days)
    history = await cursor.to_list(length=days)
    return history

async def get_bp_trend(patient_id: str, days: int = 3):
    cursor = readings_collection.find({"patient_id": patient_id}).sort("timestamp", pymongo.DESCENDING).limit(days)
    history = await cursor.to_list(length=days)
    return [doc["vitals"]["systolic"] for doc in history]

async def save_reading(reading_dict: dict) -> str:
    result = await readings_collection.insert_one(reading_dict)
    return str(result.inserted_id)

async def save_analysis(analysis_dict: dict) -> str:
    result = await analysis_results_collection.insert_one(analysis_dict)
    return str(result.inserted_id)

async def get_doctor_patients(doctor_id: str):
    cursor = users_collection.find({"doctor_id": doctor_id, "role": "patient"})
    patients = await cursor.to_list(length=100)
    return patients

async def get_unread_alerts(doctor_id: str):
    cursor = alerts_collection.find({"doctor_id": doctor_id, "status": {"$ne": "read"}}).sort("timestamp", pymongo.DESCENDING)
    alerts = await cursor.to_list(length=50)
    return alerts

# ─── Engine 4: Wellbeing Queries ───────────────────────────────────────────────

async def save_wellbeing_log(log_dict: dict) -> str:
    result = await wellbeing_logs_collection.insert_one(log_dict)
    return str(result.inserted_id)

async def get_wellbeing_history(patient_id: str, days: int = 7):
    cursor = wellbeing_logs_collection.find({"patient_id": patient_id}).sort("timestamp", pymongo.DESCENDING).limit(days)
    docs = await cursor.to_list(length=days)
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs

async def get_sleep_trend(patient_id: str, days: int = 7):
    history = await get_wellbeing_history(patient_id, days)
    return [h.get("sleep", {}).get("total_hours", 0) for h in reversed(history)]

async def get_mood_trend(patient_id: str, days: int = 7):
    history = await get_wellbeing_history(patient_id, days)
    return [h.get("hormonal", {}).get("mood_score", 3) for h in reversed(history)]

async def get_activity_trend(patient_id: str, days: int = 7):
    history = await get_wellbeing_history(patient_id, days)
    return [h.get("activity", {}).get("walked_today", False) for h in reversed(history)]

def get_hormonal_week(day_post_delivery: int) -> int:
    """Return week number (1-indexed) from day post delivery."""
    return max(1, (day_post_delivery // 7) + 1)

# ─── Engine 2: PPD Assessment Queries ──────────────────────────────────────────

async def save_ppd_assessment(assessment_dict: dict) -> str:
    from backend.db.mongodb import ppd_assessments_collection
    result = await ppd_assessments_collection.insert_one(assessment_dict)
    return str(result.inserted_id)

async def get_ppd_history(patient_id: str, days: int = 30):
    from backend.db.mongodb import ppd_assessments_collection
    cursor = ppd_assessments_collection.find(
        {"patient_id": patient_id}
    ).sort("timestamp", pymongo.DESCENDING).limit(days)
    docs = await cursor.to_list(length=days)
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs

async def update_ppd_assessment(assessment_id: str, update_dict: dict):
    from backend.db.mongodb import ppd_assessments_collection
    from bson import ObjectId
    await ppd_assessments_collection.update_one(
        {"_id": ObjectId(assessment_id)},
        {"$set": update_dict}
    )

async def get_last_full_chat_date(patient_id: str):
    from backend.db.mongodb import ppd_assessments_collection
    doc = await ppd_assessments_collection.find_one(
        {"patient_id": patient_id, "conversation_complete": True},
        sort=[("timestamp", pymongo.DESCENDING)]
    )
    return doc["timestamp"] if doc else None
