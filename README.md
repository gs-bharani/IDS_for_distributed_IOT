# Network Security Simulator (IDS)

A comprehensive Network Intrusion Detection System (IDS) simulator. This application allows users to simulate various network attacks (DoS, MITM, Port Scan, etc.) and visualize them in real-time while an IDS monitors and alerts on suspicious activity.

## Tech Stack

### Backend
*   **Framework**: FastAPI (Python)
*   **Database**: MongoDB (Motor async driver)
*   **Packet Manipulation**: Scapy
*   **ML/Analytics**: Scikit-Learn, NumPy, Pandas

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS, Radix UI
*   **Visualization**: React Flow

## Prerequisites
*   **Python**: 3.8 or higher
*   **Node.js**: 14 or higher
*   **MongoDB**: Local installation or Atlas URI

## Setup Instructions

### 1. Backend Setup

Navigate to the `backend` directory:
```bash
cd backend
```

Create a virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=network_simulator_db
JWT_SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 2. Frontend Setup

Navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

## Running the Application

### Start the Backend
From the `backend` directory (ensure venv is activated):
```bash
python -m uvicorn app.main:app --reload
```
The API will be available at `http://127.0.0.1:8000`.

### Start the Frontend
From the `frontend` directory:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.
