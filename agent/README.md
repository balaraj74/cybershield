# CyberShield AI - Endpoint Agent

Lightweight Windows endpoint monitoring agent with AI-powered threat detection and auto-response.

## Features

- **Process Monitoring** - Tracks CPU, memory, I/O, threads for every running process
- **File System Watching** - Detects ransomware patterns (mass encryption, suspicious extensions)
- **Network Monitoring** - Identifies C2 connections, data exfiltration, port scanning
- **Auto-Response** - Automatically kills malicious processes above threat threshold
- **Backend Integration** - Reports to CyberShield cloud dashboard for centralized monitoring

## Quick Start

### 1. Install Dependencies

```bash
cd agent
pip install -r requirements.txt
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env with your backend URL
```

### 3. Run Agent

```bash
# Normal monitoring mode
python agent.py

# Test backend connectivity
python agent.py --test

# Run attack simulation (for demos)
python agent.py --simulate
```

## Architecture

```
┌──────────────────────────────────────────────┐
│           CyberShield Endpoint Agent         │
├──────────────┬───────────────┬───────────────┤
│   Process    │  File System  │   Network     │
│   Monitor    │    Watcher    │   Monitor     │
│  (psutil)    │  (watchdog)   │  (psutil)     │
├──────────────┴───────────────┴───────────────┤
│              Auto-Responder                  │
│         (Kill suspicious processes)          │
├──────────────────────────────────────────────┤
│         Backend Communication                │
│    (HTTP → FastAPI → AI Engine)              │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│         CyberShield Cloud Backend            │
├──────────────────────────────────────────────┤
│   AI Engine (Isolation Forest)               │
│   Anomaly Detection → Threat Scoring         │
│   Dashboard API → Next.js Frontend           │
└──────────────────────────────────────────────┘
```

## Feature Vector (Per Process)

| Feature | Description |
|---------|-------------|
| avg_cpu | Average CPU usage % |
| max_cpu | Peak CPU usage % |
| avg_memory_mb | Average memory (MB) |
| max_memory_mb | Peak memory (MB) |
| total_io_writes | Total disk write operations |
| io_write_rate | Disk write rate (bytes/sec) |
| io_read_rate | Disk read rate (bytes/sec) |
| file_write_count | Number of file writes |
| file_rename_count | Number of file renames |
| connection_count | Active network connections |
| outbound_connections | Outbound connections |
| thread_count | Number of threads |
| execution_frequency | Times seen in scans |
| parent_pid | Parent process ID |
| uptime_seconds | Process uptime |

## Attack Simulation

The built-in simulator tests three attack patterns:

1. **Ransomware** - Mass file creation with `.encrypted` extensions
2. **Port Scanning** - Multiple connection attempts to suspicious ports
3. **CPU Mining** - High CPU intensive computation

```bash
python agent.py --simulate
```

## Safety Features

- **Protected Process List** - System processes can never be killed
- **Configurable Thresholds** - Adjust sensitivity for your environment
- **Graceful Termination** - Tries SIGTERM before SIGKILL
- **PID Reuse Protection** - Verifies process identity before killing
- **Standalone Mode** - Works even if backend is unreachable
