#!/usr/bin/env python3
import time
import requests
import json
import sys
import serial
import serial.tools.list_ports
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import os

# Configuration (Use environment variables for production flexibility)
NEXTFORGE_URL = os.environ.get("NEXTFORGE_URL", "https://nextforge.onrender.com")

# Shared state between threads
printer_serial = None
is_running = True

def print_header():
    print("="*60)
    print("💣 NEXTFORGE HARDWARE AGENT - MULTI-THREADED BRIDGE")
    print("="*60)

def auto_detect_printer() -> serial.Serial:
    print("[*] HW SCAN: Scanning local USB/Serial ports...")
    try:
        ports = serial.tools.list_ports.comports()
    except Exception as e:
        print(f"⚠️  HW SCAN ERROR: Could not list ports ({e})")
        return None
    
    if not ports:
        print("⚠️  HW SCAN: No USB/Serial devices found. (MOCK MODE ACTIVE)")
        return None

    for p in ports:
        print(f"    - Attempting: {p.device} ({p.description})")
        try:
            ser = serial.Serial(p.device, 115200, timeout=2)
            time.sleep(1) # Wait for reset
            ser.write(b"M115\n")
            response = ser.readline().decode('utf-8', errors='ignore').strip()
            
            if response or "Marlin" in response or "FIRMWARE" in response:
                print(f"[+] HW SCAN: Connected to Genuine Hardware on {p.device}")
                return ser
            ser.close()
        except:
            continue

    return None

def send_status(machine_id, status_signal):
    """Helper to send immediate online/offline signals."""
    try:
        requests.post(
            f"{NEXTFORGE_URL}/api/hardware/heartbeat", 
            json={"machine_id": machine_id, "status": status_signal},
            timeout=5
        )
        print(f"📡 [STATUS] Sent signal: {status_signal}")
    except:
        pass

def heartbeat_worker(machine_id):
    """Background thread to keep the 'Online' status alive at a very low frequency."""
    print(f"📡 [HB THREAD] Heartbeat worker started (Standby mode: 5 min interval)")
    while is_running:
        try:
            print(f"📡 [HB] Standby heartbeat...")
            send_status(machine_id, "heartbeat")
        except Exception as e:
            print(f"⚠️  [HB] Network Error: {e}")
        
        # Idle/Standby heartbeat every 5 minutes
        time.sleep(300)

def poll_worker(machine_id):
    """Background thread to poll for jobs and execute them."""
    global printer_serial
    print(f"🔁 [POLL THREAD] Job polling started for {machine_id}")
    
    # Attempt one-time HW detection at thread start
    printer_serial = auto_detect_printer()
    if printer_serial:
        print("[+] [POLL] Hardware Bridge: ARMED (PHYSICAL)")
    else:
        print("[+] [POLL] Hardware Bridge: ARMED (VIRTUAL / CLOUD)")

    while is_running:
        try:
            # Poll for jobs
            response = requests.get(
                f"{NEXTFORGE_URL}/api/hardware/poll?machine_id={machine_id}",
                timeout=10
            )
            data = response.json()
            
            # ON-DEMAND VERIFICATION: If the server asks for a ping, give it immediately.
            if data.get("ping_required"):
                print("⚡ [POLL] On-demand ping requested by server. Responding...")
                send_status(machine_id, "heartbeat")

            if data.get("has_job"):
                job = data["job"]
                print(f"\n⚠️  [POLL] PAYLOAD DETECTED! Job ID: {job['id']}")
                execute_job(job)
                
        except Exception as e:
            pass
            
        time.sleep(10)

def execute_job(job):
    payload = job['payload']
    print(f"[>>] EXEC: Sending payload to hardware bridge...")
    
    # Simulation or Real execution
    commands = payload.splitlines() if "\n" in payload else ["G28", "G1 Z10", "G1 X50 Y50"]
    
    try:
        for cmd in commands:
            if not cmd.strip(): continue
            print(f"   [TX] {cmd}")
            if printer_serial:
                printer_serial.write((cmd + "\n").encode())
                # Wait for 'ok' (simplified for logic)
                res = printer_serial.readline().decode('utf-8', errors='ignore').strip()
            else:
                time.sleep(0.5) # Mock execution
        
        # Mark Complete
        requests.post(f"{NEXTFORGE_URL}/api/hardware/complete", json={"job_id": job["id"]}, timeout=10)
        print("[+] EXEC: Job finished and notified.")
        
    except Exception as e:
        print(f"❌ EXEC ERROR: {e}")
        requests.post(f"{NEXTFORGE_URL}/api/hardware/complete", json={"job_id": job["id"], "failed": True}, timeout=10)

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status": "online", "threads": "active"}')
    def log_message(self, format, *args): pass

def run_health_server():
    port = int(os.environ.get('PORT', 10000))
    print(f"[*] HEALTH: Liveness server active on port {port}")
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    server.serve_forever()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 hardware_agent.py <MACHINE_ID>")
        sys.exit(1)
        
    machine_id = sys.argv[1]
    print_header()

    # 0. Immediate STARTUP signal
    send_status(machine_id, "online")

    # 1. Health Server (Background)
    threading.Thread(target=run_health_server, daemon=True).start()
    
    # 2. Heartbeat Signal (Background) - The most critical part for the dashboard
    threading.Thread(target=heartbeat_worker, args=(machine_id,), daemon=True).start()
    
    # 3. Main Logic (Polling and Execution)
    try:
        poll_worker(machine_id)
    except KeyboardInterrupt:
        print("\n[*] SHUTDOWN: Stopping agent...")
        is_running = False
        send_status(machine_id, "offline") # Immediate SHUTDOWN signal
        if printer_serial: printer_serial.close()
        time.sleep(1) # Give it a second to send the signal

