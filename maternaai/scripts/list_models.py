import os
import asyncio
from google import genai
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent.parent / 'backend' / '.env'
load_dotenv(dotenv_path=env_path)

async def list_models():
    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key or "")
    try:
        models = client.models.list()
        for m in models:
            print(f"Model ID: {m.name}, Name: {m.display_name}")
    except Exception as e:
        print(f"List Models Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_models())
