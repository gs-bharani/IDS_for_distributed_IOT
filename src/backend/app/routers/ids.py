from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime
import numpy as np
import joblib

router = APIRouter()

scaler = joblib.load("app/ml_models/intrusion_detection_scaler.pkl")
model = joblib.load("app/ml_models/intrusion_detection_model.pkl")

THREAT_LEVELS = {
    "MITM Detected": "High",
    "Port Scan Pattern": "Medium",
    "DoS Spike": "High",
    "Anomaly Detected": "Medium"
}

class IntrusionLogRequest(BaseModel):
    intrusion_logs: Dict[str, float]

class DetectionResponse(BaseModel):
    alert: Optional[Dict[str, str]] = None
    message: str

@router.post("/detect-intrusion", response_model=DetectionResponse)
async def detect_intrusion(payload: IntrusionLogRequest):
    features = [
        "duration", "src_bytes", "dst_bytes", "land", "wrong_fragment", "urgent", "hot",
        "num_failed_logins", "logged_in", "num_compromised", "root_shell", "su_attempted",
        "num_root", "num_file_creations", "num_shells", "num_access_files",
        "num_outbound_cmds", "is_host_login", "is_guest_login", "count", "srv_count",
        "serror_rate", "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate",
        "diff_srv_rate", "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count",
        "dst_host_same_srv_rate", "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
        "dst_host_srv_diff_host_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate",
        "dst_host_rerror_rate", "dst_host_srv_rerror_rate"
    ]
    X = np.array([[payload.intrusion_logs.get(k, 0.0) for k in features]])
    pred = model.predict(scaler.transform(X))[0]

    return DetectionResponse(
        alert={
            "timestamp": datetime.utcnow().isoformat(),
            "threat_type": "Network Intrusion",
            "threat_level": "High",
            "details": "ML detection triggered"
        } if pred == 1 else None,
        message="ML Detection Complete"
    )


@router.post("/detect-mitm", response_model=DetectionResponse)
def detect_mitm(payload: Dict[str, str]):
    ip_table = payload.get("arp_table", "")
    if ip_table.count("ff:ff:ff:ff:ff:ff") > 0 or "duplicate" in ip_table:
        return DetectionResponse(
            alert={
                "timestamp": datetime.utcnow().isoformat(),
                "threat_type": "MITM Detected",
                "threat_level": THREAT_LEVELS["MITM Detected"],
                "details": "ARP spoofing signature detected."
            },
            message="MITM check complete"
        )
    return DetectionResponse(message="No MITM detected")


@router.post("/detect-signature", response_model=DetectionResponse)
def detect_signature(payload: Dict[str, float]):
    if payload.get("packet_rate", 0) > 1000:
        return DetectionResponse(
            alert={
                "timestamp": datetime.utcnow().isoformat(),
                "threat_type": "DoS Spike",
                "threat_level": THREAT_LEVELS["DoS Spike"],
                "details": "High packet rate matches DoS attack signature"
            },
            message="Signature-based check complete"
        )
    return DetectionResponse(message="No known signature match")


@router.post("/detect-anomaly", response_model=DetectionResponse)
def detect_anomaly(payload: Dict[str, float]):
    ratio = payload.get("tcp_to_udp_ratio", 0)
    if ratio > 10:
        return DetectionResponse(
            alert={
                "timestamp": datetime.utcnow().isoformat(),
                "threat_type": "Anomaly Detected",
                "threat_level": THREAT_LEVELS["Anomaly Detected"],
                "details": f"Suspicious TCP/UDP traffic ratio: {ratio}"
            },
            message="Heuristic anomaly detection complete"
        )
    return DetectionResponse(message="No anomalies found")
