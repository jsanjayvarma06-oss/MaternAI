import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.maternaai

# Collections
users_collection = db.users
readings_collection = db.readings
analysis_results_collection = db.analysis_results
alerts_collection = db.alerts

async def init_db():
    # Create indexes
    await readings_collection.create_index([("patient_id", 1), ("timestamp", -1)])
    await analysis_results_collection.create_index([("patient_id", 1), ("timestamp", -1)])
    await alerts_collection.create_index([("doctor_id", 1), ("status", 1)])
    print("MongoDB indexes created")
