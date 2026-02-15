"""
CyberShield AI - Endpoint Agent Configuration
Settings for the monitoring agent
"""
import os
import uuid
import json
import platform
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ============================================
# Agent Identity
# ============================================

DEVICE_ID_FILE = Path(__file__).parent / ".device_id"

def get_or_create_device_id() -> str:
    """Get existing device ID or create a new one"""
    if DEVICE_ID_FILE.exists():
        return DEVICE_ID_FILE.read_text().strip()
    device_id = str(uuid.uuid4())
    DEVICE_ID_FILE.write_text(device_id)
    return device_id

DEVICE_ID = get_or_create_device_id()
DEVICE_NAME = platform.node()
OS_VERSION = f"{platform.system()} {platform.release()}"

# ============================================
# Backend Connection
# ============================================

BACKEND_URL = os.getenv("CYBERSHIELD_BACKEND_URL", "http://localhost:8001")
API_KEY = os.getenv("CYBERSHIELD_API_KEY", "cybershield-api-key")
ENDPOINT_API_BASE = f"{BACKEND_URL}/api/v1/endpoint"

# ============================================
# Monitoring Settings
# ============================================

# How often to collect process snapshots (seconds)
PROCESS_SCAN_INTERVAL = int(os.getenv("SCAN_INTERVAL", "10"))

# How often to send behavior logs to backend (seconds)
REPORT_INTERVAL = int(os.getenv("REPORT_INTERVAL", "30"))

# How often to check for commands from backend (seconds)
COMMAND_POLL_INTERVAL = int(os.getenv("COMMAND_POLL_INTERVAL", "15"))

# Directories to monitor for file system changes
WATCH_DIRECTORIES = json.loads(os.getenv("WATCH_DIRECTORIES", '[]')) or [
    os.path.expanduser("~/Documents"),
    os.path.expanduser("~/Desktop"),
    os.path.expanduser("~/Downloads"),
]

# ============================================
# Thresholds
# ============================================

# CPU usage threshold for flagging (percentage)
CPU_THRESHOLD = float(os.getenv("CPU_THRESHOLD", "80.0"))

# Memory usage threshold for flagging (percentage)
MEMORY_THRESHOLD = float(os.getenv("MEMORY_THRESHOLD", "500.0"))  # MB

# Network connections threshold
NET_CONNECTIONS_THRESHOLD = int(os.getenv("NET_CONNECTIONS_THRESHOLD", "50"))

# File operations per minute threshold
FILE_OPS_THRESHOLD = int(os.getenv("FILE_OPS_THRESHOLD", "100"))

# ============================================
# Logging
# ============================================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", str(Path(__file__).parent / "agent.log"))

# Max behavior records to keep in memory before force-sending
MAX_BUFFER_SIZE = int(os.getenv("MAX_BUFFER_SIZE", "500"))

# ============================================
# Auto Response
# ============================================

# Whether the agent is allowed to auto-kill processes
AUTO_KILL_ENABLED = os.getenv("AUTO_KILL_ENABLED", "true").lower() == "true"

# Anomaly score threshold for auto-kill (0.0-1.0)
AUTO_KILL_THRESHOLD = float(os.getenv("AUTO_KILL_THRESHOLD", "0.85"))

# Processes that should NEVER be killed (system-critical)
PROTECTED_PROCESSES = {
    # Windows
    "system", "system idle process", "csrss.exe", "smss.exe",
    "wininit.exe", "services.exe", "lsass.exe", "svchost.exe",
    "explorer.exe", "dwm.exe", "winlogon.exe", "taskhost.exe",
    "spoolsv.exe", "conhost.exe", "dllhost.exe", "sihost.exe",
    "taskhostw.exe", "runtimebroker.exe", "shellexperiencehost.exe",
    "searchui.exe", "startmenuexperiencehost.exe",
    # Linux
    "systemd", "init", "kthreadd", "ksoftirqd", "kworker",
    "Xorg", "Xwayland", "gdm", "gdm3", "lightdm", "sddm",
    "gnome-shell", "gnome-session", "dbus-daemon", "pulseaudio",
    "pipewire", "NetworkManager", "snapd", "cron", "rsyslogd",
    "bash", "zsh", "fish", "sh",
    # CyberShield agent itself
    "cybershield_agent", "python", "python3", "python.exe", "python3.exe", "pythonw.exe",
}
