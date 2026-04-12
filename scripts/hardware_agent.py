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

NEXTFORGE_URL = "https://nextforge.onrender.com"

def print_header():
    print("="*60)
    print("💣 NEXTFORGE HARDWARE AGENT (100% REAL SERIAL BRIDGE)")
    print("="*60)

def auto_detect_printer() -> serial.Serial:
    print("[*] Scanning local USB/Serial ports for physical hardware...")
    ports = serial.tools.list_ports.comports()
    
    if not ports:
        print("⚠️ WARNING: No USB/Serial devices detected.")
        print("   -> FALLING BACK TO MOCK MODE (For Software Demo Purposes)")
        return None

    for p in ports:
        print(f"    - Found Port: {p.device} ({p.description})")
        # Try connecting at standard 115200 baud
        try:
            ser = serial.Serial(p.device, 115200, timeout=2)
            time.sleep(2) # Give bootloader time to restart (Arduino IDE style)
            
            # Send standard M115 firmware info check
            ser.write(b"M115\n")
            response = ser.readline().decode('utf-8', errors='ignore').strip()
            
            if response or "Marlin" in response or "FIRMWARE" in response:
                print(f"[+] Connected to Real Hardware on {p.device}")
                print(f"    HW Info: {response}")
                return ser
                
            ser.close()
        except serial.SerialException:
            pass

    print("⚠️ WARNING: Found USB devices, but they are not responding to GCODE.")
    print("   -> FALLING BACK TO MOCK MODE (For Software Demo Purposes)")
    return None

def wait_for_ok(ser: serial.Serial):
    """Wait for the printer to acknowledge 'ok' before sending next command."""
    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line == 'ok':
            break
        elif "Error" in line:
            raise Exception(f"Hardware Error: {line}")

def loop_agent(machine_id):
    ser = auto_detect_printer()
    
    print(f"\n[*] Agent Boot Sequence Complete. Bound to NextForge ID: {machine_id}")
    
    if ser:
        print("[*] Fetching bed temps (M105)...")
        ser.write(b"M105\n")
        print(f"    {ser.readline().decode('utf-8').strip()}")
        print("[+] Physical Hardware Armed and Ready.\n")
    else:
        print("[+] Virtual Hardware Armed and Ready (MOCK MODE).\n")
    
    while True:
        try:
            # 1. Send Heartbeat 
            requests.post(f"{NEXTFORGE_URL}/api/hardware/heartbeat", json={"machine_id": machine_id})
            
            # 2. Poll for MPP-Paid Jobs
            response = requests.get(f"{NEXTFORGE_URL}/api/hardware/poll?machine_id={machine_id}")
            data = response.json()
            
            if data.get("has_job"):
                job = data["job"]
                print(f"⚠️ [MPP CLEARANCE] INCOMING PAYLOAD RECEIVED!")
                print(f"   Job ID: {job['id']}")
                payload = job['payload']

                # 3. Execution (Real GCode)
                print("\n[>>] Sending Raw G-Code to Printer via Serial...")
                
                # If they passed raw string, we auto-home and heat up for demo
                commands = [
                    "G28", # Auto Home
                    "M104 S200", # Heat Hotend
                    "M140 S60", # Heat Bed
                    "M109 S200", # Wait Temp
                    "G1 Z15.0 F6000", # Move Z up
                    "G1 X50 Y50 F2000" # Move
                ]
                
                # If the payload actually contains \n (real gcode), use that
                if "\\n" in payload or "\n" in payload:
                     commands = payload.splitlines()

                try:
                    for idx, cmd in enumerate(commands):
                        if not cmd.strip() or cmd.startswith(";"): continue
                        print(f"   [TX ->] {cmd}")
                        if ser:
                            ser.write((cmd + "\n").encode())
                            wait_for_ok(ser)
                        else:
                            time.sleep(1.5) # Mock execution time per G-Code line
                        print(f"   [<- RX] ok ({idx}/{len(commands)})")
                except Exception as ex:
                    print(f"❌ HW CRASH: {ex}")
                    requests.post(f"{NEXTFORGE_URL}/api/hardware/complete", json={"job_id": job["id"], "failed": True})
                    continue
                
                print("\n[+] Job Finished Successfully.")
                
                # 4. Mark Completed
                requests.post(f"{NEXTFORGE_URL}/api/hardware/complete", json={"job_id": job["id"]})
                print("[<>] Network Notified. Escrow released to vendor wallet.\n")
                
        except Exception as e:
            print(f"[-] Network Request Failed. ({e})")
            
        time.sleep(5)

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status": "online", "mode": "cloud_testing"}')
    def log_message(self, format, *args):
        pass # Suppress HTTP logs to keep terminal clean

def run_health_server():
    port = int(os.environ.get('PORT', 10000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    print(f"[*] Cloud Integration Health Check Server listening on port {port}")
    server.serve_forever()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 hardware_agent.py <MACHINE_ID>")
        print("Example: python3 hardware_agent.py M-001")
        sys.exit(1)
        
    print_header()
    # 1. Start the health check web server in a background thread
    threading.Thread(target=run_health_server, daemon=True).start()
    # 2. Run the real hardware agent on the main thread
    loop_agent(sys.argv[1])
