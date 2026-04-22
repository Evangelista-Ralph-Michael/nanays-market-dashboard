# backend/database.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load the environment variables from the .env file we just created
load_dotenv()

# Fetch the URL and Key
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Supabase credentials not found. Please check your .env file.")

# Initialize and export the Supabase client
supabase: Client = create_client(url, key)

