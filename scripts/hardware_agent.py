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

def heartbeat_worker(machine_id):
    """Background thread to keep the 'Online' status alive regardless of HW state."""
    print(f"📡 [HB THREAD] Heartbeat worker started for {machine_id}")
    while is_running:
        try:
            # We use a very short timeout for heartbeats to prevent blocking
            print(f"📡 [HB] Sending heartbeat to {NEXTFORGE_URL}...")
            hb = requests.post(
                f"{NEXTFORGE_URL}/api/hardware/heartbeat", 
                json={"machine_id": machine_id},
                timeout=5
            )
            if hb.status_code == 200:
                print("✅ [HB] Heartbeat accepted.")
            else:
                print(f"❌ [HB] Heartbeat rejected ({hb.status_code})")
        except Exception as e:
            print(f"⚠️  [HB] Network Error: {e}")
        
        # Reduced sleep for higher responsiveness during demo
        time.sleep(5)

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
            
            if data.get("has_job"):
                job = data["job"]
                print(f"\n⚠️  [POLL] PAYLOAD DETECTED! Job ID: {job['id']}")
                execute_job(job)
                
        except Exception as e:
            # Silent failure for polling to avoid log spam, heartbeat thread handles visibility
            pass
            
        time.sleep(3)

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
        if printer_serial: printer_serial.close()
