import os
from square.client import Client
from dotenv import load_dotenv
from pathlib import Path

# Get the base directory (backend folder)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from the backend directory
load_dotenv(os.path.join(BASE_DIR, '.env'))

square_client = Client(
    access_token=os.getenv("SQUARE_ACCESS_TOKEN"),
    environment="sandbox"  # or "production"
)

location_id = os.getenv("SQUARE_LOCATION_ID")
