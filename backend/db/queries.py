from backend.db.mongodb import (
    users_collection,
    readings_collection,
    analysis_results_collection,
    alerts_collection
)
from datetime import datetime
import pymongo

async def get_patient_history(patient_id: str, days: int = 7):
    # For now, just getting the last `days` readings assuming 1 per day
    cursor = readings_collection.find({"patient_id": patient_id}).sort("timestamp", pymongo.DESCENDING).limit(days)
    history = await cursor.to_list(length=days)
    return history

async def get_bp_trend(patient_id: str, days: int = 3):
    cursor = readings_collection.find({"patient_id": patient_id}).sort("timestamp", pymongo.DESCENDING).limit(days)
    history = await cursor.to_list(length=days)
    # Extracts history from newest to oldest. We want oldest to newest for trend?
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
    # Status "unread" or implicit
    cursor = alerts_collection.find({"doctor_id": doctor_id, "status": {"$ne": "read"}}).sort("timestamp", pymongo.DESCENDING)
    alerts = await cursor.to_list(length=50)
    return alerts
