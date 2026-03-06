from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from dotenv import load_dotenv
load_dotenv()

# --- Database Connection ---
from .database.mongo import connect_db, close_db

# --- API Routers ---
from .routers import auth
from .routers import scenario, attack # <--- ADD THIS LINE

# --- Create FastAPI App Instance ---
app = FastAPI(title="Network Security Simulator API", version="0.1.0")

# --- CORS Configuration (Keep as is, but ensure your frontend URL is listed if you remove "*") ---
# --- CORS Configuration ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://192.168.0.100:3000",  # Example LAN access
    "http://192.168.0.100:5173",
    "http://your-production-domain.com",  # Replace with prod domain if needed
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Event Handlers (Startup and Shutdown) ---
@app.on_event("startup")
async def startup_event():
    print("Application starting up...")
    await connect_db()

@app.on_event("shutdown")
async def shutdown_event():
    print("Application shutting down...")
    await close_db()

# --- Include API Routers ---
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(scenario.router, prefix="/api/scenarios", tags=["Scenario Management"])
app.include_router(attack.router, prefix="/api/attacks", tags=["Attack Lab"]) # <--- ADD THIS LINE

# --- Root Endpoint (Optional, for basic check) ---
@app.get("/")
async def read_root():
    return {"message": "Network Simulator API is running successfully!"}

# --- Main Entry Point for Uvicorn ---
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)