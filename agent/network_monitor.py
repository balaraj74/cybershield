"""
CyberShield AI - Network Monitor
Tracks network connections for suspicious activity
"""
import logging
import psutil
from datetime import datetime
from typing import Dict, List, Set
from collections import defaultdict
from dataclasses import dataclass, field, asdict

logger = logging.getLogger("cybershield.network")

# Known malicious ports (common for C2, data exfiltration)
SUSPICIOUS_PORTS = {
    4444,   # Metasploit default
    5555,   # Common backdoor
    6666, 6667, 6668, 6669,  # IRC (C2)
    8080,   # Common proxy / alt HTTP
    8443,   # Alt HTTPS
    9090,   # Common admin
    31337,  # Back Orifice
    12345,  # NetBus
    20000,  # DNP3 (SCADA)
    1234,   # Common test/backdoor
    4445,   # Metasploit
    5900, 5901,  # VNC
    3389,   # RDP
    22,     # SSH (suspicious if unexpected)
}

# Well-known legitimate ports
LEGITIMATE_PORTS = {80, 443, 53, 123, 993, 995, 587, 465, 143, 110, 25}


@dataclass
class ConnectionInfo:
    """Network connection details"""
    pid: int
    process_name: str
    local_address: str
    local_port: int
    remote_address: str
    remote_port: int
    status: str
    family: str  # IPv4 / IPv6
    is_suspicious_port: bool
    is_outbound: bool
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class NetworkActivitySummary:
    """Summary of network activity"""
    total_connections: int = 0
    outbound_connections: int = 0
    inbound_connections: int = 0
    listening_ports: int = 0
    unique_remote_ips: int = 0
    unique_remote_ports: int = 0
    suspicious_connections: int = 0
    suspicious_ports_used: List[int] = field(default_factory=list)
    high_connection_processes: List[dict] = field(default_factory=list)
    new_connections_since_last: int = 0
    data_transfer_indicator: str = "normal"  # normal, elevated, high
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> dict:
        return asdict(self)


class NetworkMonitor:
    """
    Monitors network connections for:
    - Suspicious outbound connections
    - Connections to known malicious ports
    - Unusual connection volume per process
    - Data exfiltration patterns
    """

    def __init__(self):
        self._known_connections: Set[str] = set()
        self._connection_history: List[ConnectionInfo] = []
        self._process_connection_counts: Dict[str, int] = defaultdict(int)

    def scan_connections(self) -> List[ConnectionInfo]:
        """Scan all network connections"""
        connections = []
        current_conn_keys = set()

        try:
            for conn in psutil.net_connections(kind='inet'):
                try:
                    # Get process info
                    pid = conn.pid or 0
                    proc_name = "unknown"
                    if pid:
                        try:
                            proc = psutil.Process(pid)
                            proc_name = proc.name()
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            pass

                    # Parse addresses
                    local_addr = conn.laddr.ip if conn.laddr else ""
                    local_port = conn.laddr.port if conn.laddr else 0
                    remote_addr = conn.raddr.ip if conn.raddr else ""
                    remote_port = conn.raddr.port if conn.raddr else 0

                    # Determine if outbound
                    is_outbound = conn.status == 'ESTABLISHED' and remote_addr != ""

                    # Check for suspicious ports
                    is_suspicious = (
                        remote_port in SUSPICIOUS_PORTS or
                        local_port in SUSPICIOUS_PORTS
                    )

                    # Connection family
                    family = "IPv4" if conn.family.name == 'AF_INET' else "IPv6"

                    conn_info = ConnectionInfo(
                        pid=pid,
                        process_name=proc_name,
                        local_address=local_addr,
                        local_port=local_port,
                        remote_address=remote_addr,
                        remote_port=remote_port,
                        status=conn.status,
                        family=family,
                        is_suspicious_port=is_suspicious,
                        is_outbound=is_outbound,
                    )
                    connections.append(conn_info)

                    # Track connection key for new connection detection
                    conn_key = f"{pid}:{local_port}->{remote_addr}:{remote_port}"
                    current_conn_keys.add(conn_key)

                    # Track per-process counts
                    self._process_connection_counts[proc_name] += 1

                except Exception as e:
                    logger.debug(f"Error processing connection: {e}")
                    continue

        except psutil.AccessDenied:
            logger.warning("Access denied for network connections - run with elevated privileges")
        except Exception as e:
            logger.error(f"Error scanning connections: {e}")

        # Detect new connections
        new_conns = current_conn_keys - self._known_connections
        self._known_connections = current_conn_keys

        self._connection_history = connections

        if new_conns:
            logger.debug(f"Detected {len(new_conns)} new connections")

        return connections

    def get_activity_summary(self) -> NetworkActivitySummary:
        """Get network activity summary"""
        connections = self._connection_history

        summary = NetworkActivitySummary()
        summary.total_connections = len(connections)

        remote_ips = set()
        remote_ports = set()
        suspicious_ports = set()
        process_counts: Dict[str, int] = defaultdict(int)

        for conn in connections:
            if conn.is_outbound:
                summary.outbound_connections += 1
            elif conn.status == 'LISTEN':
                summary.listening_ports += 1
            else:
                summary.inbound_connections += 1

            if conn.remote_address:
                remote_ips.add(conn.remote_address)
            if conn.remote_port:
                remote_ports.add(conn.remote_port)

            if conn.is_suspicious_port:
                summary.suspicious_connections += 1
                suspicious_ports.add(conn.remote_port or conn.local_port)

            process_counts[conn.process_name] += 1

        summary.unique_remote_ips = len(remote_ips)
        summary.unique_remote_ports = len(remote_ports)
        summary.suspicious_ports_used = list(suspicious_ports)

        # Identify processes with high connection counts
        summary.high_connection_processes = [
            {"name": name, "connections": count}
            for name, count in sorted(process_counts.items(), key=lambda x: -x[1])[:10]
            if count > 5
        ]

        # Determine data transfer level
        if summary.outbound_connections > 100:
            summary.data_transfer_indicator = "high"
        elif summary.outbound_connections > 30:
            summary.data_transfer_indicator = "elevated"
        else:
            summary.data_transfer_indicator = "normal"

        return summary

    def get_process_connections(self, pid: int) -> List[dict]:
        """Get connections for a specific process"""
        return [
            c.to_dict() for c in self._connection_history
            if c.pid == pid
        ]
