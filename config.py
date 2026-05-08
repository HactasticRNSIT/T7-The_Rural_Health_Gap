import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'patients.db')
    DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
