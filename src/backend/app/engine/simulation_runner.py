import asyncio
from datetime import datetime
from ..engine.simulation import (
    run_port_scan, simulate_dos_attack, simulate_mitm, simulate_brute_force
)
from ..models.attack import (
    PortScanConfig, DoSConfig, MitMConfig, BruteForceConfig,
    PortScanResults, DoSResults, MitMResults, BruteForceResults
)

async def execute_attack(attack_id, config, db, email):
    attack_type = config.attack_type
    result = None

    try:
        await db.attacks.update_one(
            {"attack_id": attack_id},
            {"$set": {"status": "running", "message": "Simulation started."}}
        )

        await asyncio.sleep(1)  # simulate init delay

        if attack_type == "port_scan":
            result = run_port_scan("127.0.0.1", config.port_range_start, config.port_range_end)
        elif attack_type == "dos":
            result = simulate_dos_attack("127.0.0.1", 80)
        elif attack_type == "mitm":
            result = simulate_mitm("192.168.0.2", "192.168.0.3")
        elif attack_type == "brute_force":
            result = simulate_brute_force("http://127.0.0.1:8000/login", ["admin"], ["1234", "admin"])

        await db.attacks.update_one(
            {"attack_id": attack_id},
            {
                "$set": {
                    "status": "completed",
                    "message": "Attack simulation completed.",
                    "completed_at": datetime.utcnow(),
                    "results": result.model_dump() if result else {}
                }
            }
        )

    except Exception as e:
        await db.attacks.update_one(
            {"attack_id": attack_id},
            {
                "$set": {
                    "status": "failed",
                    "message": f"Simulation failed: {str(e)}",
                    "completed_at": datetime.utcnow()
                }
            }
        )
