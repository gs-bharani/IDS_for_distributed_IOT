from motor.motor_asyncio import AsyncIOMotorClient
import os

# Load environment variables (ensure python-dotenv is installed and .env file is present)
from dotenv import load_dotenv
load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017") # Default to local if not set

client: AsyncIOMotorClient = None # Global client instance

async def connect_db():  # <--- CHECK THIS FUNCTION DEFINITION
    """Connects to the MongoDB database."""
    global client
    try:
        client = AsyncIOMotorClient(MONGO_DETAILS)
        # The ping command is a cheap way to check if the connection is active.
        await client.admin.command('ping')
        print("Connected to MongoDB!")
    except Exception as e:
        print(f"Could not connect to MongoDB at {MONGO_DETAILS}: {e}")
        import sys
        sys.exit(1)

async def close_db():  # <--- CHECK THIS FUNCTION DEFINITION
    """Closes the MongoDB connection."""
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB.")

def get_database():
    """Returns the MongoDB database instance."""
    if client is None:
        raise Exception("Database client is not initialized. Call connect_db() first.")
    return client.network_simulator_db # 'network_simulator_db' will be your database name