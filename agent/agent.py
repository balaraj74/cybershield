"""
CyberShield AI - Endpoint Agent
Main agent that orchestrates monitoring, detection, and response.

Usage:
    python agent.py                  # Run agent
    python agent.py --simulate       # Run with attack simulation
    python agent.py --test           # Run connectivity test
"""
import sys
import time
import json
import signal
import logging
import argparse
import threading
import requests
from datetime import datetime
from typing import Optional

from config import (
    DEVICE_ID, DEVICE_NAME, OS_VERSION,
    BACKEND_URL, API_KEY, ENDPOINT_API_BASE,
    PROCESS_SCAN_INTERVAL, REPORT_INTERVAL, COMMAND_POLL_INTERVAL,
    WATCH_DIRECTORIES, MAX_BUFFER_SIZE,
)
from monitor import ProcessMonitor
from file_watcher import FileSystemWatcher
from network_monitor import NetworkMonitor
from auto_response import AutoResponder

# ============================================
# Logging Setup
# ============================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)-25s | %(levelname)-8s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("agent.log", mode='a'),
    ]
)
logger = logging.getLogger("cybershield.agent")


class CyberShieldAgent:
    """
    Main endpoint agent that coordinates:
    1. Process monitoring (CPU, memory, IO, threads)
    2. File system watching (ransomware detection)
    3. Network monitoring (C2, exfiltration)
    4. Auto-response (kill suspicious processes)
    5. Backend communication (report + receive commands)
    """

    def __init__(self):
        self.device_id = DEVICE_ID
        self.device_name = DEVICE_NAME
        self.os_version = OS_VERSION
        
        # Core modules
        self.process_monitor = ProcessMonitor()
        self.file_watcher = FileSystemWatcher(WATCH_DIRECTORIES)
        self.network_monitor = NetworkMonitor()
        self.auto_responder = AutoResponder()
        
        # State
        self._running = False
        self._registered = False
        self._report_buffer = []
        self._last_report_time = time.time()
        self._scan_count = 0

        logger.info("=" * 60)
        logger.info("  CyberShield AI - Endpoint Agent")
        logger.info(f"  Device ID:   {self.device_id}")
        logger.info(f"  Device Name: {self.device_name}")
        logger.info(f"  OS:          {self.os_version}")
        logger.info(f"  Backend:     {BACKEND_URL}")
        logger.info("=" * 60)

    def start(self):
        """Start the agent"""
        self._running = True

        # Register with backend
        self._register_device()

        # Start file system watcher
        self.file_watcher.start()

        # Start monitoring loop
        logger.info("🚀 Agent started - monitoring endpoint...")
        
        try:
            while self._running:
                self._monitoring_cycle()
                time.sleep(PROCESS_SCAN_INTERVAL)
        except KeyboardInterrupt:
            logger.info("Agent stopped by user (Ctrl+C)")
        finally:
            self.stop()

    def stop(self):
        """Stop the agent"""
        self._running = False
        self.file_watcher.stop()
        
        # Send final report
        self._send_report(force=True)
        
        logger.info("🛑 Agent stopped")

    def _monitoring_cycle(self):
        """Single monitoring cycle"""
        self._scan_count += 1
        cycle_start = time.time()

        # 1. Scan processes
        self.process_monitor.scan_processes()

        # 2. Scan network connections
        self.network_monitor.scan_connections()

        # 3. Collect behavior data
        behavior_report = self.process_monitor.get_behavior_report()
        file_activity = self.file_watcher.get_activity_summary()
        network_activity = self.network_monitor.get_activity_summary()
        system_metrics = self.process_monitor.get_system_metrics()

        # 4. Local anomaly checks (before AI model)
        self._check_local_anomalies(behavior_report, file_activity, network_activity)

        # 5. Buffer the report
        report_data = {
            "device_id": self.device_id,
            "device_name": self.device_name,
            "scan_number": self._scan_count,
            "behavior": behavior_report,
            "file_activity": file_activity.to_dict(),
            "network_activity": network_activity.to_dict(),
            "system_metrics": system_metrics,
            "response_actions": self.auto_responder.get_action_log(),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        self._report_buffer.append(report_data)

        # 6. Send report if interval elapsed or buffer is full
        elapsed = time.time() - self._last_report_time
        if elapsed >= REPORT_INTERVAL or len(self._report_buffer) >= MAX_BUFFER_SIZE:
            self._send_report()

        # 7. Check for backend commands
        if self._scan_count % max(1, COMMAND_POLL_INTERVAL // PROCESS_SCAN_INTERVAL) == 0:
            self._poll_commands()

        cycle_time = time.time() - cycle_start
        if self._scan_count % 6 == 0:  # Log every ~60 seconds
            logger.info(
                f"📊 Scan #{self._scan_count} | "
                f"Processes: {behavior_report['total_processes']} | "
                f"File events: {file_activity.total_events} | "
                f"Net conns: {network_activity.total_connections} | "
                f"Cycle: {cycle_time:.2f}s"
            )

    def _check_local_anomalies(self, behavior_report, file_activity, network_activity):
        """
        Quick local checks for obvious anomalies.
        These run before the AI model for instant response.
        """
        # Check for mass file operations (ransomware indicator)
        if file_activity.mass_file_ops:
            logger.warning("⚠️ MASS FILE OPERATIONS DETECTED - possible ransomware!")

        if file_activity.ransomware_ext_detected > 0:
            logger.critical(
                f"🚨 RANSOMWARE EXTENSION DETECTED! "
                f"{file_activity.ransomware_ext_detected} files with suspicious extensions"
            )

        if file_activity.suspicious_renames > 0:
            logger.warning(
                f"⚠️ SUSPICIOUS RENAMES: {file_activity.suspicious_renames} files "
                f"renamed to known ransomware extensions"
            )

        # Check for suspicious network activity
        if network_activity.suspicious_connections > 0:
            logger.warning(
                f"⚠️ SUSPICIOUS CONNECTIONS: {network_activity.suspicious_connections} "
                f"connections on suspicious ports: {network_activity.suspicious_ports_used}"
            )

        # Check for processes with very high resource usage
        for proc in behavior_report.get("process_behaviors", []):
            if proc.get("max_cpu", 0) > 90 and proc.get("io_write_rate", 0) > 10_000_000:
                logger.warning(
                    f"⚠️ HIGH CPU + HIGH IO: {proc['name']} (PID: {proc['pid']}) | "
                    f"CPU: {proc['max_cpu']:.1f}% | Write rate: {proc['io_write_rate']:.0f} B/s"
                )

    def _register_device(self):
        """Register this device with the backend"""
        try:
            payload = {
                "device_id": self.device_id,
                "device_name": self.device_name,
                "os_version": self.os_version,
                "agent_version": "1.0.0",
                "capabilities": [
                    "process_monitoring",
                    "file_monitoring", 
                    "network_monitoring",
                    "auto_response"
                ],
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
            
            response = requests.post(
                f"{ENDPOINT_API_BASE}/register",
                json=payload,
                headers={"X-API-Key": API_KEY},
                timeout=10,
            )

            if response.status_code == 200:
                self._registered = True
                logger.info("✅ Device registered with backend")
            else:
                logger.warning(f"Device registration failed: {response.status_code}")
                # Continue anyway - agent can work standalone
                
        except requests.ConnectionError:
            logger.warning("Cannot connect to backend - running in standalone mode")
        except Exception as e:
            logger.warning(f"Registration error: {e} - running in standalone mode")

    def _send_report(self, force: bool = False):
        """Send buffered reports to backend"""
        if not self._report_buffer:
            return

        payload = {
            "device_id": self.device_id,
            "reports": self._report_buffer,
            "report_count": len(self._report_buffer),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        try:
            response = requests.post(
                f"{ENDPOINT_API_BASE}/report",
                json=payload,
                headers={"X-API-Key": API_KEY},
                timeout=15,
            )

            if response.status_code == 200:
                result = response.json()
                
                # Process any threat detections from backend AI
                threats = result.get("threats", [])
                for threat in threats:
                    self._handle_backend_threat(threat)

                logger.info(
                    f"📤 Report sent ({len(self._report_buffer)} scans) | "
                    f"Threats detected: {len(threats)}"
                )
                self._report_buffer.clear()
                self._last_report_time = time.time()

            else:
                logger.warning(f"Report send failed: {response.status_code}")

        except requests.ConnectionError:
            logger.debug("Backend unreachable - buffering reports")
            # Keep buffer, will retry next cycle
            if len(self._report_buffer) > MAX_BUFFER_SIZE:
                # Prevent memory overflow - drop oldest
                dropped = len(self._report_buffer) - MAX_BUFFER_SIZE
                self._report_buffer = self._report_buffer[dropped:]
                logger.warning(f"Buffer overflow - dropped {dropped} oldest reports")

        except Exception as e:
            logger.error(f"Report send error: {e}")

    def _handle_backend_threat(self, threat: dict):
        """Handle a threat detection from the backend AI model"""
        pid = threat.get("pid", 0)
        process_name = threat.get("process_name", "unknown")
        anomaly_score = threat.get("anomaly_score", 0)
        reason = threat.get("reason", "AI anomaly detection")

        action = self.auto_responder.handle_threat(
            pid=pid,
            process_name=process_name,
            anomaly_score=anomaly_score,
            reason=reason,
        )

        logger.info(
            f"Threat response: {action.action_type} | "
            f"{process_name} (PID: {pid}) | "
            f"Success: {action.success}"
        )

    def _poll_commands(self):
        """Poll backend for manual commands from dashboard"""
        try:
            response = requests.get(
                f"{ENDPOINT_API_BASE}/commands/{self.device_id}",
                headers={"X-API-Key": API_KEY},
                timeout=5,
            )

            if response.status_code == 200:
                commands = response.json().get("commands", [])
                for cmd in commands:
                    logger.info(f"Executing command from dashboard: {cmd}")
                    action = self.auto_responder.execute_backend_command(cmd)
                    
                    # Report command result back
                    self._report_command_result(cmd, action)

        except requests.ConnectionError:
            pass  # Backend unreachable, silently skip
        except Exception as e:
            logger.debug(f"Command poll error: {e}")

    def _report_command_result(self, command: dict, action):
        """Report command execution result back to backend"""
        try:
            requests.post(
                f"{ENDPOINT_API_BASE}/command-result",
                json={
                    "device_id": self.device_id,
                    "command_id": command.get("id", ""),
                    "action": action.to_dict(),
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                },
                headers={"X-API-Key": API_KEY},
                timeout=5,
            )
        except Exception:
            pass


# ============================================
# Attack Simulator (for demos/testing)
# ============================================

def simulate_attacks():
    """
    Simulate various attack patterns for testing.
    Run this to validate the detection engine.
    """
    import os
    import tempfile
    import socket

    logger.info("=" * 60)
    logger.info("  🧪 ATTACK SIMULATION MODE")
    logger.info("=" * 60)

    # Simulation 1: Mass file creation (ransomware behavior)
    logger.info("\n🔴 Simulation 1: Ransomware-like file creation")
    temp_dir = tempfile.mkdtemp(prefix="cybershield_sim_")
    for i in range(100):
        filepath = os.path.join(temp_dir, f"document_{i}.txt.encrypted")
        with open(filepath, 'w') as f:
            f.write(f"Simulated encrypted content {i}" * 100)
    logger.info(f"Created 100 'encrypted' files in {temp_dir}")

    # Simulation 2: High network connections
    logger.info("\n🔴 Simulation 2: Port scanning behavior")
    sockets = []
    for port in [80, 443, 8080, 4444, 5555]:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.5)
            s.connect_ex(('127.0.0.1', port))
            sockets.append(s)
        except Exception:
            pass
    logger.info(f"Attempted {len(sockets)} connections")

    # Simulation 3: CPU-intensive process
    logger.info("\n🔴 Simulation 3: CPU-intensive computation")
    import hashlib
    start = time.time()
    for i in range(100000):
        hashlib.sha256(str(i).encode()).hexdigest()
    elapsed = time.time() - start
    logger.info(f"CPU-intensive task completed in {elapsed:.2f}s")

    # Cleanup
    time.sleep(2)
    for s in sockets:
        try:
            s.close()
        except Exception:
            pass

    # Clean up temp files
    import shutil
    try:
        shutil.rmtree(temp_dir)
    except Exception:
        pass

    logger.info("\n✅ Attack simulations complete")
    logger.info("Check the agent logs for detection results")


def test_connection():
    """Test connectivity to backend"""
    logger.info("Testing backend connection...")
    try:
        response = requests.get(
            f"{BACKEND_URL}/health",
            headers={"X-API-Key": API_KEY},
            timeout=5,
        )
        if response.status_code == 200:
            data = response.json()
            logger.info(f"✅ Backend connected: {json.dumps(data, indent=2)}")
        else:
            logger.warning(f"Backend returned status {response.status_code}")
    except requests.ConnectionError:
        logger.error("❌ Cannot connect to backend")
    except Exception as e:
        logger.error(f"❌ Connection error: {e}")


# ============================================
# Entry Point
# ============================================

def main():
    parser = argparse.ArgumentParser(description="CyberShield AI Endpoint Agent")
    parser.add_argument("--simulate", action="store_true", help="Run attack simulation")
    parser.add_argument("--test", action="store_true", help="Test backend connectivity")
    args = parser.parse_args()

    if args.test:
        test_connection()
        return

    if args.simulate:
        simulate_attacks()
        return

    # Normal agent mode
    agent = CyberShieldAgent()
    
    # Handle graceful shutdown
    def signal_handler(sig, frame):
        logger.info("Shutdown signal received...")
        agent.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    agent.start()


if __name__ == "__main__":
    main()
