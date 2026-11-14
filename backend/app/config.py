
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BACKEND_DIR / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-120b"
)

DATABASE_PATH = os.getenv(
    "DATABASE_PATH",
    "app/database/logdetect.db"
)

MAX_UPLOAD_SIZE_MB = int(
    os.getenv("MAX_UPLOAD_SIZE_MB", "5")
)

MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".log",
    ".txt",
    ".json",
    ".csv"
}

DATABASE_FILE = BACKEND_DIR / DATABASE_PATH
