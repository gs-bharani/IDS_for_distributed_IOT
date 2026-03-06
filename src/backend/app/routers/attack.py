from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import uuid4
from bson import ObjectId
from datetime import datetime

from ..engine.simulation import run_port_scan, simulate_dos_attack, simulate_mitm, simulate_brute_force
from ..models.users import UserBase
from ..routers.ids import detect_intrusion, detect_signature, detect_anomaly, detect_mitm
from ..routers.ids import IntrusionLogRequest
from ..models.attack import (
    AttackLaunchRequest,
    AttackStatusResponse,
    PyObjectId,
    PortScanResults,
    DoSResults,
    MitMResults,
    BruteForceResults,
    MalwareDeliveryResults,
    DDoSResults,
    AttackResults
)
from ..services.auth_service import get_current_user_from_token
from ..database.mongo import get_database
from ..models.scenario import ScenarioInDB

router = APIRouter()

@router.post("/launch", response_model=AttackStatusResponse, status_code=status.HTTP_202_ACCEPTED)
async def launch_attack(
    attack_request: AttackLaunchRequest,
    current_user: UserBase = Depends(get_current_user_from_token)
):
    if not ObjectId.is_valid(attack_request.scenario_id):
        raise HTTPException(status_code=400, detail="Invalid scenario ID format.")

    db = get_database()
    scenario_data = await db.scenarios.find_one({
        "_id": ObjectId(attack_request.scenario_id),
        "owner_email": current_user.email
    })

    if not scenario_data:
        raise HTTPException(status_code=404, detail="Scenario not found or not owned by the user.")

    scenario_obj = ScenarioInDB(**scenario_data)
    all_node_ids = {node.id for node in scenario_obj.nodes}

    if attack_request.attack_config.source_node_id not in all_node_ids:
        raise HTTPException(status_code=400, detail="Invalid source node.")

    if attack_request.attack_config.target_node_id not in all_node_ids:
        if attack_request.attack_config.attack_type == "mitm":
            if not hasattr(attack_request.attack_config, 'target_node_id_secondary') or \
               attack_request.attack_config.target_node_id_secondary not in all_node_ids:
                raise HTTPException(status_code=400, detail="Invalid target nodes for MitM.")
        else:
            raise HTTPException(status_code=400, detail="Invalid target node.")

    attack_id = str(uuid4())
    now = datetime.utcnow()
    config = attack_request.attack_config

    results_obj = None
    ids_alert = None
    import time
    start = time.time()
    print("🚀 Running attack:", config.attack_type)

    # Run actual simulation
    if config.attack_type == "port_scan":
        results_obj = run_port_scan("127.0.0.1", config.port_range_start, config.port_range_end)
        detection_result = detect_signature({"packet_rate": 1500})
        if detection_result.alert:
            ids_alert = detection_result.alert

    elif config.attack_type == "dos":
        # Use config values if available (assuming attack_config model has these fields or they are passed in extras)
        duration = getattr(config, 'duration', 60)
        packet_rate = getattr(config, 'packet_rate', 100)
        results_obj = simulate_dos_attack("127.0.0.1", 80, duration=duration, packet_rate=packet_rate)
        detection_result = detect_signature({"packet_rate": 5000})
        if detection_result.alert:
            ids_alert = detection_result.alert

    elif config.attack_type == "mitm":
        results_obj = simulate_mitm("192.168.0.2", "192.168.0.3")
        arp_table = "192.168.1.1 ff:ff:ff:ff:ff:ff\n192.168.1.2 aa:bb:cc:dd:ee:ff"
        detection_result = detect_mitm({"arp_table": arp_table})
        if detection_result.alert:
            ids_alert = detection_result.alert

    elif config.attack_type == "brute_force":
        # Use config values or defaults
        usernames = getattr(config, 'usernames', ["admin"])
        passwords = getattr(config, 'passwords', ["1234", "admin"])
        # Ensure they are lists (handle potential string input from CSV)
        if isinstance(usernames, str):
            usernames = [u.strip() for u in usernames.split(',')]
        if isinstance(passwords, str):
            passwords = [p.strip() for p in passwords.split(',')]
            
        # Target the actual auth endpoint which is likely /api/auth/token
        results_obj = await simulate_brute_force("http://127.0.0.1:8000/api/auth/token", usernames, passwords)
        intrusion_logs = {
            "duration": 250, "src_bytes": 12000, "dst_bytes": 50000, "land": 1,
            "num_failed_logins": 10, "logged_in": 0, "hot": 15,
            "wrong_fragment": 2, "urgent": 2, "num_compromised": 12,
            "root_shell": 1, "su_attempted": 1, "num_root": 20,
            "num_file_creations": 10, "num_shells": 2, "num_access_files": 10,
            "num_outbound_cmds": 0, "is_host_login": 0, "is_guest_login": 1,
            "count": 500, "srv_count": 500,
            "serror_rate": 0.9, "srv_serror_rate": 0.9, "rerror_rate": 0.9,
            "srv_rerror_rate": 0.9, "same_srv_rate": 0.1, "diff_srv_rate": 0.9,
            "srv_diff_host_rate": 0.9, "dst_host_count": 250, "dst_host_srv_count": 250,
            "dst_host_same_srv_rate": 0.2, "dst_host_diff_srv_rate": 0.8,
            "dst_host_same_src_port_rate": 0.8, "dst_host_srv_diff_host_rate": 0.9,
            "dst_host_serror_rate": 0.9, "dst_host_srv_serror_rate": 0.9,
            "dst_host_rerror_rate": 0.9, "dst_host_srv_rerror_rate": 0.9
        }
        detection_result = await detect_intrusion(IntrusionLogRequest(intrusion_logs=intrusion_logs))
        if detection_result.alert:
            ids_alert = detection_result.alert

    # Save to MongoDB
    attack_doc = {
        "attack_id": attack_id,
        "status": "completed",
        "message": "Attack simulation completed.",
        "scenario_id": attack_request.scenario_id,
        "attack_type": config.attack_type,
        "source_node_id": config.source_node_id,
        "target_node_id": config.target_node_id,
        "initiator": str(current_user.email),
        "started_at": now,
        "completed_at": now,
        "results": results_obj if results_obj else None,
        "ids_alert": ids_alert
    }

    attack_doc.update(config.model_dump(exclude_unset=True))
    await db.attacks.insert_one(attack_doc)
    inserted = await db.attacks.find_one({"attack_id": attack_id})
    print("✅ Simulation complete in", time.time() - start, "seconds")

    return AttackStatusResponse(**inserted)


@router.get("/", response_model=List[AttackStatusResponse])
async def get_attack_history(current_user: UserBase = Depends(get_current_user_from_token)):
    db = get_database()
    attacks = await db.attacks.find({"initiator": current_user.email}).sort("started_at", -1).to_list(length=50)
    return [AttackStatusResponse(**a) for a in attacks]
