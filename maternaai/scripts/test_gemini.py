import os
import asyncio
from google import genai
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent.parent / 'backend' / '.env'
load_dotenv(dotenv_path=env_path)

async def test_gemini():
    api_key = os.environ.get("GEMINI_API_KEY")
    print(f"Using API Key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")
    
    client = genai.Client(api_key=api_key or "")
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash", # Try flash first for speed/check
            contents="Say 'Maya is ready'"
        )
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Gemini Test Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
