#!/usr/bin/env python3
"""
CyberShield AI - Validation Suite
==================================
Simulates real attack patterns and measures detection accuracy.

Validation Criteria:
  ✅ 80%+ detection of abnormal behavior
  ✅ Manageable false positive rate (<20%)
  ✅ Each attack type independently detected

Usage:
    python validate.py              # Run all simulations
    python validate.py --ransomware # Run only ransomware simulation
    python validate.py --network    # Run only network flood simulation
    python validate.py --exfil      # Run only data exfiltration simulation
"""

import os
import sys
import time
import json
import shutil
import socket
import hashlib
import tempfile
import logging
import argparse
import requests
import threading
import subprocess
import multiprocessing
from datetime import datetime
from typing import Dict, List, Tuple
from dataclasses import dataclass, field

# ============================================
# Config
# ============================================

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
API_KEY = os.environ.get("API_KEY", "cybershield-api-key")
ENDPOINT_API = f"{BACKEND_URL}/api/v1/endpoint"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)-20s | %(levelname)-8s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("validation.log", mode='w'),
    ]
)
logger = logging.getLogger("validation")


# ============================================
# Data Classes
# ============================================

@dataclass
class SimulationResult:
    """Result of a single simulation"""
    name: str
    attack_type: str
    behaviors_generated: int = 0
    threats_detected: int = 0
    anomaly_scores: List[float] = field(default_factory=list)
    detection_rate: float = 0.0
    avg_anomaly_score: float = 0.0
    max_anomaly_score: float = 0.0
    details: List[str] = field(default_factory=list)
    duration_seconds: float = 0.0
    success: bool = False

    def compute_metrics(self):
        if self.behaviors_generated > 0:
            self.detection_rate = self.threats_detected / self.behaviors_generated
        if self.anomaly_scores:
            self.avg_anomaly_score = sum(self.anomaly_scores) / len(self.anomaly_scores)
            self.max_anomaly_score = max(self.anomaly_scores)
        self.success = self.detection_rate >= 0.8


@dataclass
class ValidationReport:
    """Full validation report"""
    timestamp: str = ""
    total_simulations: int = 0
    total_behaviors: int = 0
    total_detections: int = 0
    overall_detection_rate: float = 0.0
    false_positive_rate: float = 0.0
    results: List[SimulationResult] = field(default_factory=list)
    normal_baseline: SimulationResult = None
    passed: bool = False

    def compute(self):
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        self.total_simulations = len(self.results)
        self.total_behaviors = sum(r.behaviors_generated for r in self.results)
        self.total_detections = sum(r.threats_detected for r in self.results)

        attack_behaviors = sum(r.behaviors_generated for r in self.results)
        attack_detections = sum(r.threats_detected for r in self.results)
        if attack_behaviors > 0:
            self.overall_detection_rate = attack_detections / attack_behaviors

        if self.normal_baseline and self.normal_baseline.behaviors_generated > 0:
            self.false_positive_rate = (
                self.normal_baseline.threats_detected /
                self.normal_baseline.behaviors_generated
            )

        # Pass if detection >= 80% and false positives < 20%
        self.passed = (
            self.overall_detection_rate >= 0.80 and
            self.false_positive_rate < 0.20
        )


# ============================================
# Helper: Send behaviors to AI engine
# ============================================

def send_behaviors_to_ai(behaviors: List[dict], device_id: str = "validator-001") -> List[dict]:
    """
    Send process behaviors to the backend AI engine
    and return detected threats.
    """
    reports = [{
        "device_id": device_id,
        "device_name": f"Validator-{device_id.split('-')[-1].upper()}",
        "scan_number": 1,
        "behavior": {
            "process_behaviors": behaviors,
            "new_processes": [],
            "terminated_processes": [],
            "total_processes": len(behaviors),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        "file_activity": {
            "total_events": 0,
            "created_count": 0,
            "deleted_count": 0,
            "modified_count": 0,
            "renamed_count": 0,
            "sensitive_files_touched": 0,
            "ransomware_ext_detected": 0,
            "mass_file_ops": False,
            "suspicious_renames": 0,
        },
        "network_activity": {
            "total_connections": sum(b.get("connection_count", 0) for b in behaviors),
            "outbound_connections": sum(b.get("outbound_connections", 0) for b in behaviors),
            "suspicious_connections": 0,
            "unique_remote_ips": 0,
            "suspicious_ports_used": [],
        },
        "system_metrics": {
            "cpu_percent": max((b.get("avg_cpu", 0) for b in behaviors), default=0),
            "memory_percent": 50.0,
            "cpu_count": multiprocessing.cpu_count(),
            "memory_total_gb": 16.0,
            "memory_used_gb": 8.0,
            "disk_total_gb": 500.0,
            "disk_used_gb": 250.0,
            "disk_percent": 50.0,
            "net_bytes_sent": 0,
            "net_bytes_recv": 0,
            "net_connections": 10,
            "boot_time": datetime.utcnow().isoformat() + "Z",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }]

    payload = {
        "device_id": device_id,
        "reports": reports,
        "report_count": 1,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    try:
        resp = requests.post(
            f"{ENDPOINT_API}/report",
            json=payload,
            headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get("threats", [])
        else:
            logger.error(f"Backend returned {resp.status_code}: {resp.text[:200]}")
            return []
    except Exception as e:
        logger.error(f"Failed to send behaviors: {e}")
        return []


# ============================================
# Simulation 1: Ransomware
# ============================================

def simulate_ransomware() -> SimulationResult:
    """
    Simulate ransomware behavior:
    - Very high CPU usage
    - Extreme disk write rates (encrypting files)
    - High file write counts
    - Suspicious process names
    - Low network but high IO
    """
    result = SimulationResult(
        name="Ransomware Simulation",
        attack_type="ransomware",
    )
    start = time.time()

    logger.info("=" * 60)
    logger.info("🔴 SIMULATION 1: RANSOMWARE ATTACK")
    logger.info("=" * 60)

    # Also generate actual file system activity for the file watcher
    temp_dir = tempfile.mkdtemp(prefix="cybershield_ransom_")
    logger.info(f"  Creating ransomware-like file activity in {temp_dir}")

    # Create files with ransomware extensions
    for i in range(50):
        # Create normal file then rename to encrypted extension
        normal_path = os.path.join(temp_dir, f"document_{i:03d}.docx")
        encrypted_path = os.path.join(temp_dir, f"document_{i:03d}.docx.locked")
        with open(normal_path, 'w') as f:
            f.write(f"Important document content {i}\n" * 100)
        os.rename(normal_path, encrypted_path)

    for i in range(30):
        path = os.path.join(temp_dir, f"photo_{i:03d}.jpg.encrypted")
        with open(path, 'wb') as f:
            f.write(os.urandom(4096))  # Random bytes = "encrypted"

    for i in range(20):
        path = os.path.join(temp_dir, f"spreadsheet_{i:03d}.xlsx.cryptowall")
        with open(path, 'w') as f:
            f.write(hashlib.sha256(str(i).encode()).hexdigest() * 100)

    logger.info(f"  Created 100 ransomware-like files")

    # Generate ransomware-like process behaviors
    ransomware_behaviors = [
        # Process 1: File encryptor (extreme disk writes, high CPU)
        {
            "pid": 66601,
            "name": "svchost_helper.exe",
            "avg_cpu": 95.2,
            "max_cpu": 99.8,
            "avg_memory_mb": 450.0,
            "max_memory_mb": 680.0,
            "total_io_writes": 50000,
            "io_write_rate": 52428800.0,  # 50 MB/s write rate
            "io_read_rate": 31457280.0,   # 30 MB/s read rate
            "file_write_count": 2500,
            "file_rename_count": 2500,    # Renaming = encrypting
            "connection_count": 2,
            "outbound_connections": 1,
            "thread_count": 16,
            "execution_frequency": 1,
            "parent_pid": 1,
            "uptime_seconds": 45.0,
            "is_new_process": True,
            "exe_path": "/tmp/svchost_helper",
            "snapshot_count": 3,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        # Process 2: Ransom note dropper
        {
            "pid": 66602,
            "name": "README_DECRYPT.exe",
            "avg_cpu": 45.0,
            "max_cpu": 72.0,
            "avg_memory_mb": 180.0,
            "max_memory_mb": 256.0,
            "total_io_writes": 10000,
            "io_write_rate": 10485760.0,  # 10 MB/s
            "io_read_rate": 524288.0,
            "file_write_count": 500,
            "file_rename_count": 0,
            "connection_count": 5,
            "outbound_connections": 3,
            "thread_count": 4,
            "execution_frequency": 1,
            "parent_pid": 66601,
            "uptime_seconds": 30.0,
            "is_new_process": True,
            "exe_path": "/tmp/README_DECRYPT",
            "snapshot_count": 2,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        # Process 3: Shadow copy deleter
        {
            "pid": 66603,
            "name": "vssadmin_clone.exe",
            "avg_cpu": 78.0,
            "max_cpu": 92.0,
            "avg_memory_mb": 120.0,
            "max_memory_mb": 200.0,
            "total_io_writes": 5000,
            "io_write_rate": 20971520.0,  # 20 MB/s
            "io_read_rate": 15728640.0,
            "file_write_count": 100,
            "file_rename_count": 50,
            "connection_count": 0,
            "outbound_connections": 0,
            "thread_count": 8,
            "execution_frequency": 1,
            "parent_pid": 66601,
            "uptime_seconds": 20.0,
            "is_new_process": True,
            "exe_path": "/tmp/vssadmin_clone",
            "snapshot_count": 2,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    ]

    result.behaviors_generated = len(ransomware_behaviors)
    logger.info(f"  Sending {len(ransomware_behaviors)} ransomware behaviors to AI engine...")

    threats = send_behaviors_to_ai(ransomware_behaviors, device_id="validator-ransom")
    result.threats_detected = len(threats)
    result.anomaly_scores = [t.get("anomaly_score", 0) for t in threats]

    for t in threats:
        detail = (
            f"  ⚠️  DETECTED: {t['process_name']} (PID {t['pid']}) | "
            f"Score: {t['anomaly_score']:.2f} | Severity: {t['severity']} | "
            f"Reason: {t['reason']}"
        )
        result.details.append(detail)
        logger.info(detail)

    # Cleanup
    try:
        shutil.rmtree(temp_dir)
    except Exception:
        pass

    result.duration_seconds = time.time() - start
    result.compute_metrics()

    logger.info(f"  Detection rate: {result.detection_rate*100:.0f}% "
                f"({result.threats_detected}/{result.behaviors_generated})")
    return result


# ============================================
# Simulation 2: High Network Traffic / Port Scan
# ============================================

def simulate_network_flood() -> SimulationResult:
    """
    Simulate high network traffic attack:
    - Port scanning behavior
    - Many outbound connections
    - C2 beacon pattern
    - DDoS-like traffic
    """
    result = SimulationResult(
        name="Network Flood / Port Scan",
        attack_type="network_flood",
    )
    start = time.time()

    logger.info("=" * 60)
    logger.info("🔴 SIMULATION 2: NETWORK FLOOD / PORT SCAN")
    logger.info("=" * 60)

    # Generate actual network connections for the network monitor
    logger.info("  Generating port scan activity...")
    sockets_opened = []
    ports_scanned = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445,
                     993, 995, 1433, 1521, 3306, 3389, 4444, 5432,
                     5555, 5900, 6379, 8080, 8443, 9090, 27017]

    for port in ports_scanned:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.3)
            s.connect_ex(('127.0.0.1', port))
            sockets_opened.append(s)
        except Exception:
            pass

    logger.info(f"  Scanned {len(ports_scanned)} ports, {len(sockets_opened)} responded")

    # Generate network flood process behaviors
    network_behaviors = [
        # Process 1: Port scanner
        {
            "pid": 77701,
            "name": "netscan_svc.exe",
            "avg_cpu": 45.0,
            "max_cpu": 68.0,
            "avg_memory_mb": 200.0,
            "max_memory_mb": 350.0,
            "total_io_writes": 500,
            "io_write_rate": 102400.0,
            "io_read_rate": 204800.0,
            "file_write_count": 10,
            "file_rename_count": 0,
            "connection_count": 250,        # Very high connections
            "outbound_connections": 245,     # Almost all outbound
            "thread_count": 64,             # Many threads for scanning
            "execution_frequency": 1,
            "parent_pid": 1,
            "uptime_seconds": 60.0,
            "is_new_process": True,
            "exe_path": "/tmp/netscan_svc",
            "snapshot_count": 5,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        # Process 2: C2 beacon
        {
            "pid": 77702,
            "name": "update_checker.exe",
            "avg_cpu": 15.0,
            "max_cpu": 35.0,
            "avg_memory_mb": 80.0,
            "max_memory_mb": 128.0,
            "total_io_writes": 200,
            "io_write_rate": 51200.0,
            "io_read_rate": 102400.0,
            "file_write_count": 5,
            "file_rename_count": 0,
            "connection_count": 50,
            "outbound_connections": 48,
            "thread_count": 8,
            "execution_frequency": 30,      # Runs frequently (beaconing)
            "parent_pid": 1,
            "uptime_seconds": 3600.0,       # Long running
            "is_new_process": False,
            "exe_path": "/tmp/update_checker",
            "snapshot_count": 30,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        # Process 3: DDoS bot
        {
            "pid": 77703,
            "name": "worker_pool.exe",
            "avg_cpu": 88.0,
            "max_cpu": 98.0,
            "avg_memory_mb": 512.0,
            "max_memory_mb": 768.0,
            "total_io_writes": 100,
            "io_write_rate": 10240.0,
            "io_read_rate": 5120.0,
            "file_write_count": 0,
            "file_rename_count": 0,
            "connection_count": 500,        # Extreme connections
            "outbound_connections": 498,
            "thread_count": 128,            # Massive thread count
            "execution_frequency": 1,
            "parent_pid": 77701,
            "uptime_seconds": 120.0,
            "is_new_process": True,
            "exe_path": "/tmp/worker_pool",
            "snapshot_count": 10,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    ]

    result.behaviors_generated = len(network_behaviors)
    logger.info(f"  Sending {len(network_behaviors)} network attack behaviors to AI engine...")

    threats = send_behaviors_to_ai(network_behaviors, device_id="validator-netflood")
    result.threats_detected = len(threats)
    result.anomaly_scores = [t.get("anomaly_score", 0) for t in threats]

    for t in threats:
        detail = (
            f"  ⚠️  DETECTED: {t['process_name']} (PID {t['pid']}) | "
            f"Score: {t['anomaly_score']:.2f} | Severity: {t['severity']} | "
            f"Reason: {t['reason']}"
        )
        result.details.append(detail)
        logger.info(detail)

    # Cleanup sockets
    for s in sockets_opened:
        try:
            s.close()
        except Exception:
            pass

    result.duration_seconds = time.time() - start
    result.compute_metrics()

    logger.info(f"  Detection rate: {result.detection_rate*100:.0f}% "
                f"({result.threats_detected}/{result.behaviors_generated})")
    return result


# ============================================
# Simulation 3: Data Exfiltration
# ============================================

def simulate_exfiltration() -> SimulationResult:
    """
    Simulate data exfiltration:
    - Reading sensitive files (high IO reads)
    - Uploading to external servers (high outbound traffic)
    - Compressing data before sending
    - DNS tunneling pattern
    """
    result = SimulationResult(
        name="Data Exfiltration",
        attack_type="exfiltration",
    )
    start = time.time()

    logger.info("=" * 60)
    logger.info("🔴 SIMULATION 3: DATA EXFILTRATION")
    logger.info("=" * 60)

    # Generate actual exfiltration-like file reads
    temp_dir = tempfile.mkdtemp(prefix="cybershield_exfil_")
    logger.info(f"  Creating sensitive data files in {temp_dir}")

    # Create "sensitive" files
    for i in range(20):
        path = os.path.join(temp_dir, f"customer_data_{i:03d}.csv")
        with open(path, 'w') as f:
            for j in range(100):
                f.write(f"customer_{j},email_{j}@company.com,SSN-{j:09d},${j*1000:.2f}\n")

    # Simulate reading and "compressing" them
    compressed_path = os.path.join(temp_dir, "exfil_archive.tar.gz")
    total_data = 0
    for fname in os.listdir(temp_dir):
        fpath = os.path.join(temp_dir, fname)
        if os.path.isfile(fpath):
            with open(fpath, 'rb') as f:
                data = f.read()
                total_data += len(data)

    with open(compressed_path, 'wb') as f:
        f.write(os.urandom(total_data // 10))  # Simulated compressed data

    logger.info(f"  Staged {total_data/1024:.0f} KB of sensitive data")

    # Simulate outbound connections (DNS-like lookups)
    logger.info("  Simulating DNS tunneling / outbound exfiltration...")
    dns_queries = 0
    for i in range(20):
        try:
            socket.getaddrinfo(f"data{i}.evil-c2-server.invalid", 443)
        except socket.gaierror:
            dns_queries += 1  # Expected to fail
    logger.info(f"  Performed {dns_queries} DNS lookups")

    # Generate exfiltration process behaviors
    exfil_behaviors = [
        # Process 1: Data harvester (reads many files)
        {
            "pid": 88801,
            "name": "sys_inventory.exe",
            "avg_cpu": 55.0,
            "max_cpu": 75.0,
            "avg_memory_mb": 800.0,
            "max_memory_mb": 1200.0,
            "total_io_writes": 100,
            "io_write_rate": 1048576.0,     # 1 MB/s write (compressing)
            "io_read_rate": 104857600.0,    # 100 MB/s read (reading all files)
            "file_write_count": 10,
            "file_rename_count": 0,
            "connection_count": 15,
            "outbound_connections": 12,
            "thread_count": 8,
            "execution_frequency": 1,
            "parent_pid": 1,
            "uptime_seconds": 180.0,
            "is_new_process": True,
            "exe_path": "/tmp/sys_inventory",
            "snapshot_count": 15,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        # Process 2: Data uploader (high outbound)
        {
            "pid": 88802,
            "name": "cloud_sync.exe",
            "avg_cpu": 40.0,
            "max_cpu": 65.0,
            "avg_memory_mb": 300.0,
            "max_memory_mb": 512.0,
            "total_io_writes": 200,
            "io_write_rate": 524288.0,
            "io_read_rate": 52428800.0,     # 50 MB/s reads (reading staged data)
            "file_write_count": 5,
            "file_rename_count": 0,
            "connection_count": 120,        # Many connections to unique IPs
            "outbound_connections": 118,    # Almost all outbound
            "thread_count": 16,
            "execution_frequency": 1,
            "parent_pid": 88801,
            "uptime_seconds": 120.0,
            "is_new_process": True,
            "exe_path": "/tmp/cloud_sync",
            "snapshot_count": 10,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        # Process 3: DNS tunneling
        {
            "pid": 88803,
            "name": "dns_helper.exe",
            "avg_cpu": 20.0,
            "max_cpu": 40.0,
            "avg_memory_mb": 64.0,
            "max_memory_mb": 128.0,
            "total_io_writes": 50000,       # Lots of small writes
            "io_write_rate": 204800.0,
            "io_read_rate": 409600.0,
            "file_write_count": 0,
            "file_rename_count": 0,
            "connection_count": 200,        # Many DNS-like connections
            "outbound_connections": 200,
            "thread_count": 4,
            "execution_frequency": 100,     # Very frequent (tunneling)
            "parent_pid": 88801,
            "uptime_seconds": 300.0,
            "is_new_process": True,
            "exe_path": "/tmp/dns_helper",
            "snapshot_count": 100,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    ]

    result.behaviors_generated = len(exfil_behaviors)
    logger.info(f"  Sending {len(exfil_behaviors)} exfiltration behaviors to AI engine...")

    threats = send_behaviors_to_ai(exfil_behaviors, device_id="validator-exfil")
    result.threats_detected = len(threats)
    result.anomaly_scores = [t.get("anomaly_score", 0) for t in threats]

    for t in threats:
        detail = (
            f"  ⚠️  DETECTED: {t['process_name']} (PID {t['pid']}) | "
            f"Score: {t['anomaly_score']:.2f} | Severity: {t['severity']} | "
            f"Reason: {t['reason']}"
        )
        result.details.append(detail)
        logger.info(detail)

    # Cleanup
    try:
        shutil.rmtree(temp_dir)
    except Exception:
        pass

    result.duration_seconds = time.time() - start
    result.compute_metrics()

    logger.info(f"  Detection rate: {result.detection_rate*100:.0f}% "
                f"({result.threats_detected}/{result.behaviors_generated})")
    return result


# ============================================
# Baseline: Normal Behavior (False Positive Test)
# ============================================

def simulate_normal_baseline() -> SimulationResult:
    """
    Send normal, benign process behaviors to measure false positive rate.
    These should NOT trigger alerts.
    """
    result = SimulationResult(
        name="Normal Baseline (False Positive Test)",
        attack_type="normal",
    )
    start = time.time()

    logger.info("=" * 60)
    logger.info("🟢 BASELINE: NORMAL BEHAVIOR (False Positive Test)")
    logger.info("=" * 60)

    normal_behaviors = [
        # Normal web browser
        {
            "pid": 99901,
            "name": "firefox",
            "avg_cpu": 12.0,
            "max_cpu": 35.0,
            "avg_memory_mb": 450.0,
            "max_memory_mb": 600.0,
            "total_io_writes": 200,
            "io_write_rate": 51200.0,
            "io_read_rate": 102400.0,
            "file_write_count": 20,
            "file_rename_count": 2,
            "connection_count": 15,
            "outbound_connections": 12,
            "thread_count": 30,
            "execution_frequency": 100,
            "parent_pid": 1,
            "uptime_seconds": 7200.0,
            "is_new_process": False,
            "exe_path": "/usr/bin/firefox",
            "snapshot_count": 100,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        # Normal text editor
        {
            "pid": 99902,
            "name": "code",
            "avg_cpu": 8.0,
            "max_cpu": 25.0,
            "avg_memory_mb": 300.0,
            "max_memory_mb": 500.0,
            "total_io_writes": 100,
            "io_write_rate": 20480.0,
            "io_read_rate": 40960.0,
            "file_write_count": 15,
            "file_rename_count": 1,
            "connection_count": 5,
            "outbound_connections": 3,
            "thread_count": 20,
            "execution_frequency": 100,
            "parent_pid": 1,
            "uptime_seconds": 3600.0,
            "is_new_process": False,
            "exe_path": "/usr/bin/code",
            "snapshot_count": 100,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        # Normal system service
        {
            "pid": 99903,
            "name": "systemd-journal",
            "avg_cpu": 2.0,
            "max_cpu": 8.0,
            "avg_memory_mb": 50.0,
            "max_memory_mb": 80.0,
            "total_io_writes": 500,
            "io_write_rate": 10240.0,
            "io_read_rate": 5120.0,
            "file_write_count": 50,
            "file_rename_count": 0,
            "connection_count": 0,
            "outbound_connections": 0,
            "thread_count": 3,
            "execution_frequency": 200,
            "parent_pid": 1,
            "uptime_seconds": 86400.0,
            "is_new_process": False,
            "exe_path": "/usr/lib/systemd/systemd-journald",
            "snapshot_count": 200,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        # Normal package manager
        {
            "pid": 99904,
            "name": "apt",
            "avg_cpu": 15.0,
            "max_cpu": 40.0,
            "avg_memory_mb": 80.0,
            "max_memory_mb": 150.0,
            "total_io_writes": 1000,
            "io_write_rate": 2097152.0,     # 2 MB/s (installing packages)
            "io_read_rate": 5242880.0,
            "file_write_count": 100,
            "file_rename_count": 5,
            "connection_count": 8,
            "outbound_connections": 6,
            "thread_count": 4,
            "execution_frequency": 1,
            "parent_pid": 1,
            "uptime_seconds": 120.0,
            "is_new_process": True,
            "exe_path": "/usr/bin/apt",
            "snapshot_count": 10,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        # Normal music player
        {
            "pid": 99905,
            "name": "spotify",
            "avg_cpu": 5.0,
            "max_cpu": 15.0,
            "avg_memory_mb": 200.0,
            "max_memory_mb": 350.0,
            "total_io_writes": 50,
            "io_write_rate": 10240.0,
            "io_read_rate": 1048576.0,
            "file_write_count": 5,
            "file_rename_count": 0,
            "connection_count": 8,
            "outbound_connections": 6,
            "thread_count": 15,
            "execution_frequency": 100,
            "parent_pid": 1,
            "uptime_seconds": 5400.0,
            "is_new_process": False,
            "exe_path": "/usr/bin/spotify",
            "snapshot_count": 100,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    ]

    result.behaviors_generated = len(normal_behaviors)
    logger.info(f"  Sending {len(normal_behaviors)} normal behaviors to AI engine...")

    threats = send_behaviors_to_ai(normal_behaviors, device_id="validator-normal")
    result.threats_detected = len(threats)
    result.anomaly_scores = [t.get("anomaly_score", 0) for t in threats]

    if threats:
        for t in threats:
            detail = (
                f"  ❌ FALSE POSITIVE: {t['process_name']} (PID {t['pid']}) | "
                f"Score: {t['anomaly_score']:.2f} | Reason: {t['reason']}"
            )
            result.details.append(detail)
            logger.warning(detail)
    else:
        logger.info("  ✅ No false positives detected!")

    result.duration_seconds = time.time() - start
    result.compute_metrics()

    false_positive_rate = result.threats_detected / result.behaviors_generated if result.behaviors_generated else 0
    logger.info(f"  False positive rate: {false_positive_rate*100:.0f}% "
                f"({result.threats_detected}/{result.behaviors_generated})")
    return result


# ============================================
# Validation Report
# ============================================

def print_report(report: ValidationReport):
    """Print a beautiful validation report"""
    print("\n")
    print("╔" + "═" * 68 + "╗")
    print("║" + "  CYBERSHIELD AI - VALIDATION REPORT".center(68) + "║")
    print("║" + f"  {report.timestamp}".center(68) + "║")
    print("╠" + "═" * 68 + "╣")

    # Per-simulation results
    for r in report.results:
        icon = "✅" if r.detection_rate >= 0.8 else "❌"
        print(f"║  {icon} {r.name:<40} {r.detection_rate*100:5.1f}% detected ║")
        if r.anomaly_scores:
            print(f"║     Avg score: {r.avg_anomaly_score:.2f} | "
                  f"Max score: {r.max_anomaly_score:.2f} | "
                  f"Time: {r.duration_seconds:.1f}s".ljust(67) + "║")
        for d in r.details:
            # Truncate long details
            short = d.strip()[:64]
            print(f"║     {short}".ljust(69) + "║")

    # Normal baseline
    if report.normal_baseline:
        fp = report.false_positive_rate
        icon = "✅" if fp < 0.20 else "❌"
        print("╠" + "═" * 68 + "╣")
        print(f"║  {icon} {report.normal_baseline.name:<40} "
              f"{fp*100:5.1f}% FP rate ║")
        for d in report.normal_baseline.details:
            short = d.strip()[:64]
            print(f"║     {short}".ljust(69) + "║")

    # Overall
    print("╠" + "═" * 68 + "╣")
    overall_icon = "✅ PASSED" if report.passed else "❌ FAILED"
    print(f"║  Overall Detection Rate:  {report.overall_detection_rate*100:.1f}%".ljust(69) + "║")
    print(f"║  False Positive Rate:     {report.false_positive_rate*100:.1f}%".ljust(69) + "║")
    print(f"║  Total Attacks Simulated: {report.total_behaviors}".ljust(69) + "║")
    print(f"║  Total Threats Detected:  {report.total_detections}".ljust(69) + "║")
    print(f"║  Validation Result:       {overall_icon}".ljust(69) + "║")
    print("╚" + "═" * 68 + "╝")

    # Save JSON report
    report_path = os.path.join(os.path.dirname(__file__), "validation_report.json")
    report_data = {
        "timestamp": report.timestamp,
        "overall_detection_rate": round(report.overall_detection_rate, 4),
        "false_positive_rate": round(report.false_positive_rate, 4),
        "passed": report.passed,
        "criteria": {
            "min_detection_rate": 0.80,
            "max_false_positive_rate": 0.20,
        },
        "simulations": [
            {
                "name": r.name,
                "attack_type": r.attack_type,
                "behaviors_generated": r.behaviors_generated,
                "threats_detected": r.threats_detected,
                "detection_rate": round(r.detection_rate, 4),
                "avg_anomaly_score": round(r.avg_anomaly_score, 4),
                "max_anomaly_score": round(r.max_anomaly_score, 4),
                "duration_seconds": round(r.duration_seconds, 2),
                "details": r.details,
            }
            for r in report.results
        ],
        "normal_baseline": {
            "behaviors_tested": report.normal_baseline.behaviors_generated if report.normal_baseline else 0,
            "false_positives": report.normal_baseline.threats_detected if report.normal_baseline else 0,
            "false_positive_rate": round(report.false_positive_rate, 4),
        } if report.normal_baseline else None,
    }
    with open(report_path, 'w') as f:
        json.dump(report_data, f, indent=2)
    logger.info(f"\n📄 Report saved to: {report_path}")


# ============================================
# Main
# ============================================

def main():
    parser = argparse.ArgumentParser(description="CyberShield AI Validation Suite")
    parser.add_argument("--ransomware", action="store_true", help="Run only ransomware simulation")
    parser.add_argument("--network", action="store_true", help="Run only network flood simulation")
    parser.add_argument("--exfil", action="store_true", help="Run only exfiltration simulation")
    parser.add_argument("--no-baseline", action="store_true", help="Skip normal baseline test")
    args = parser.parse_args()

    run_all = not (args.ransomware or args.network or args.exfil)

    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║   🛡️  CyberShield AI - Attack Simulation & Validation   ║")
    print("╚" + "═" * 58 + "╝")

    # Check backend connectivity
    logger.info("Checking backend connectivity...")
    try:
        resp = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if resp.status_code == 200:
            logger.info("✅ Backend connected")
        else:
            logger.error(f"Backend returned {resp.status_code}")
            sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Cannot reach backend at {BACKEND_URL}: {e}")
        sys.exit(1)

    # Register validator device
    logger.info("Registering validator devices...")
    for dev_id in ["validator-ransom", "validator-netflood", "validator-exfil", "validator-normal"]:
        try:
            requests.post(
                f"{ENDPOINT_API}/register",
                json={
                    "device_id": dev_id,
                    "device_name": f"Validator-{dev_id.split('-')[1].upper()}",
                    "os_version": "Validation Suite 1.0",
                    "agent_version": "1.0.0",
                    "capabilities": ["validation"],
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                },
                headers={"X-API-Key": API_KEY},
                timeout=5,
            )
        except Exception:
            pass

    report = ValidationReport()

    # Run simulations
    if run_all or args.ransomware:
        result = simulate_ransomware()
        report.results.append(result)
        time.sleep(1)

    if run_all or args.network:
        result = simulate_network_flood()
        report.results.append(result)
        time.sleep(1)

    if run_all or args.exfil:
        result = simulate_exfiltration()
        report.results.append(result)
        time.sleep(1)

    # Normal baseline
    if not args.no_baseline:
        report.normal_baseline = simulate_normal_baseline()

    # Compute and display report
    report.compute()
    print_report(report)

    # Exit with proper code
    sys.exit(0 if report.passed else 1)


if __name__ == "__main__":
    main()
