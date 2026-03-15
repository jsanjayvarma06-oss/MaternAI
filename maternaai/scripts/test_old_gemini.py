import os
import google.generativeai as palmai
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent.parent / 'backend' / '.env'
load_dotenv(dotenv_path=env_path)

def test_old_sdk():
    api_key = os.environ.get("GEMINI_API_KEY")
    palmai.configure(api_key=api_key)
    try:
        model = palmai.GenerativeModel('models/gemini-2.5-flash')
        response = model.generate_content("Say hello")
        print(f"Old SDK Response: {response.text}")
    except Exception as e:
        print(f"Old SDK Error: {e}")

if __name__ == "__main__":
    test_old_sdk()
