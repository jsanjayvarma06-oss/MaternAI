import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend/.env
env_path = Path(__file__).parent.parent / 'backend' / '.env'
load_dotenv(dotenv_path=env_path)

async def check_users():
    uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/maternaai")
    client = AsyncIOMotorClient(uri)
    db = client.get_database()
    users_col = db.get_collection("users")
    
    ids = await users_col.distinct("_id")
    print(f"Users found in DB: {ids}")
    
    # Check for specific user from subagent
    target = "sZakHwaWmbU8bt6p9eNf77kQ4gB3"
    user = await users_col.find_one({"_id": target})
    if user:
        print(f"User {target} EXISTS in DB.")
    else:
        print(f"User {target} DOES NOT EXIST in DB.")

if __name__ == "__main__":
    asyncio.run(check_users())
