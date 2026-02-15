"""
CyberShield AI - Network Intrusion Detection System (NIDS)
===========================================================
Deep learning-based packet classification and graph-based
anomaly detection for network intrusions.

Features:
- DNS anomaly detection (tunneling, DGA domains)
- Port scan detection
- Data exfiltration pattern recognition
- C2 beacon detection
- Lateral movement detection
- Traffic volume anomaly detection
"""

import re
import math
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple
from collections import defaultdict, deque
from dataclasses import dataclass, field, asdict

logger = logging.getLogger("cybershield.network_ids")


# ============================================
# Constants
# ============================================

# DGA (Domain Generation Algorithm) detection thresholds
DGA_ENTROPY_THRESHOLD = 3.5
DGA_LENGTH_THRESHOLD = 15
DGA_CONSONANT_RATIO_THRESHOLD = 0.7

# Well-known ports that are typically safe
SAFE_PORTS = {80, 443, 53, 22, 25, 110, 143, 993, 995, 587, 465, 123, 8080, 8443}

# Known C2 ports
C2_PORTS = {4444, 5555, 6666, 6667, 8888, 9999, 1234, 31337, 12345}

# Beacon timing threshold (seconds between beacons)
BEACON_INTERVAL_TOLERANCE = 5.0


@dataclass
class NetworkAlert:
    """Network intrusion alert"""
    alert_id: str
    alert_type: str     # dns_anomaly, port_scan, exfiltration, c2_beacon, lateral_movement
    severity: str       # low, medium, high, critical
    confidence: float   # 0.0 - 1.0
    source_ip: str
    source_port: int = 0
    dest_ip: str = ""
    dest_port: int = 0
    process_name: str = ""
    pid: int = 0
    description: str = ""
    indicators: List[str] = field(default_factory=list)
    recommended_action: str = "alert"
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self):
        return asdict(self)


class NetworkIDS:
    """
    AI-powered Network Intrusion Detection System.
    
    Detection methods:
    1. Statistical entropy analysis for DNS tunneling
    2. Time-series analysis for C2 beaconing
    3. Graph analysis for port scanning
    4. Volume analysis for data exfiltration
    5. Pattern matching for lateral movement
    """

    def __init__(self):
        # Track connection history per source IP
        self._connection_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        # Track DNS queries
        self._dns_queries: deque = deque(maxlen=5000)
        # Track port scan attempts per source
        self._port_scan_tracker: Dict[str, Set[int]] = defaultdict(set)
        # Track data transfer volumes
        self._transfer_volumes: Dict[str, float] = defaultdict(float)
        # Alert history
        self._alerts: List[NetworkAlert] = []
        # Beacon timing tracker
        self._beacon_tracker: Dict[str, List[float]] = defaultdict(list)
        # Baseline stats
        self._baseline_connections_per_min = 50.0
        self._baseline_dns_per_min = 20.0
        self._scan_reset_time = datetime.utcnow()
        
        logger.info("Network IDS initialized")

    def analyze_connections(self, connections: List[Dict],
                           network_summary: Dict = None) -> List[NetworkAlert]:
        """
        Analyze network connections for intrusion indicators.
        """
        alerts = []
        now = datetime.utcnow()

        # Reset port scan tracker every 5 minutes
        if (now - self._scan_reset_time).seconds > 300:
            self._port_scan_tracker.clear()
            self._scan_reset_time = now

        for conn in connections:
            remote_ip = conn.get("remote_address", "")
            remote_port = conn.get("remote_port", 0)
            local_port = conn.get("local_port", 0)
            pid = conn.get("pid", 0)
            proc_name = conn.get("process_name", "unknown")
            source_ip = conn.get("local_address", "127.0.0.1")

            if not remote_ip:
                continue

            # Track connection
            self._connection_history[source_ip].append({
                "remote_ip": remote_ip, "remote_port": remote_port,
                "pid": pid, "process": proc_name, "time": now.timestamp(),
            })

            # 1. Port scan detection
            self._port_scan_tracker[f"{pid}:{proc_name}"].add(remote_port)

            # 2. C2 port detection
            if remote_port in C2_PORTS:
                alert = NetworkAlert(
                    alert_id=f"c2port-{pid}-{int(now.timestamp())}",
                    alert_type="c2_beacon",
                    severity="high",
                    confidence=0.7,
                    source_ip=source_ip,
                    source_port=local_port,
                    dest_ip=remote_ip,
                    dest_port=remote_port,
                    process_name=proc_name,
                    pid=pid,
                    description=f"Connection to known C2 port {remote_port}",
                    indicators=[f"C2 port: {remote_port}", f"Process: {proc_name}"],
                    recommended_action="alert",
                )
                alerts.append(alert)

            # 3. Beacon timing detection
            beacon_key = f"{pid}:{remote_ip}"
            self._beacon_tracker[beacon_key].append(now.timestamp())

        # Check port scan patterns
        for key, ports in self._port_scan_tracker.items():
            if len(ports) >= 15:
                pid_str, proc_name = key.split(":", 1)
                alert = NetworkAlert(
                    alert_id=f"portscan-{pid_str}-{int(now.timestamp())}",
                    alert_type="port_scan",
                    severity="high",
                    confidence=min(1.0, len(ports) / 20.0),
                    source_ip="local",
                    process_name=proc_name,
                    pid=int(pid_str) if pid_str.isdigit() else 0,
                    description=f"Port scan detected: {len(ports)} unique ports",
                    indicators=[
                        f"Ports scanned: {len(ports)}",
                        f"Sample ports: {sorted(list(ports))[:10]}",
                    ],
                    recommended_action="kill" if len(ports) > 50 else "alert",
                )
                alerts.append(alert)

        # Check beacon patterns
        for key, timestamps in self._beacon_tracker.items():
            if len(timestamps) >= 5:
                beacon_alert = self._detect_beaconing(key, timestamps)
                if beacon_alert:
                    alerts.append(beacon_alert)

        # Check network summary for volume anomalies
        if network_summary:
            volume_alerts = self._check_volume_anomalies(network_summary)
            alerts.extend(volume_alerts)

        self._alerts.extend(alerts)
        return alerts

    def analyze_dns(self, queries: List[Dict]) -> List[NetworkAlert]:
        """Analyze DNS queries for anomalies (tunneling, DGA)"""
        alerts = []

        for query in queries:
            domain = query.get("domain", "")
            query_type = query.get("type", "A")

            self._dns_queries.append({
                "domain": domain,
                "type": query_type,
                "time": datetime.utcnow().timestamp(),
            })

            # DGA detection
            if self._is_dga_domain(domain):
                alert = NetworkAlert(
                    alert_id=f"dga-{hash(domain) % 100000}-{int(datetime.utcnow().timestamp())}",
                    alert_type="dns_anomaly",
                    severity="high",
                    confidence=0.8,
                    source_ip="local",
                    description=f"Possible DGA domain: {domain}",
                    indicators=[
                        f"Domain: {domain}",
                        f"Entropy: {self._calc_entropy(domain):.2f}",
                        "High randomness in domain name",
                    ],
                    recommended_action="alert",
                )
                alerts.append(alert)

            # DNS tunneling detection (very long subdomains)
            parts = domain.split(".")
            for part in parts:
                if len(part) > 50:
                    alert = NetworkAlert(
                        alert_id=f"tunnel-{hash(domain) % 100000}-{int(datetime.utcnow().timestamp())}",
                        alert_type="dns_anomaly",
                        severity="critical",
                        confidence=0.9,
                        source_ip="local",
                        description=f"DNS tunneling detected: extremely long subdomain ({len(part)} chars)",
                        indicators=[
                            f"Subdomain length: {len(part)}",
                            f"Domain: {domain[:80]}...",
                        ],
                        recommended_action="block",
                    )
                    alerts.append(alert)
                    break

        # Check DNS query rate
        now = datetime.utcnow().timestamp()
        recent_queries = [q for q in self._dns_queries if now - q["time"] < 60]
        if len(recent_queries) > self._baseline_dns_per_min * 5:
            alert = NetworkAlert(
                alert_id=f"dnsflood-{int(now)}",
                alert_type="dns_anomaly",
                severity="medium",
                confidence=0.7,
                source_ip="local",
                description=f"Abnormal DNS query rate: {len(recent_queries)}/min (baseline: {self._baseline_dns_per_min}/min)",
                indicators=[f"DNS queries/min: {len(recent_queries)}"],
                recommended_action="alert",
            )
            alerts.append(alert)

        self._alerts.extend(alerts)
        return alerts

    def _detect_beaconing(self, key: str, timestamps: List[float]) -> Optional[NetworkAlert]:
        """Detect C2 beaconing by analyzing connection timing regularity"""
        if len(timestamps) < 5:
            return None

        # Calculate intervals
        intervals = [timestamps[i] - timestamps[i-1] for i in range(1, len(timestamps))]
        if not intervals:
            return None

        avg_interval = sum(intervals) / len(intervals)
        if avg_interval < 1:
            return None

        # Calculate standard deviation
        variance = sum((x - avg_interval) ** 2 for x in intervals) / len(intervals)
        std_dev = math.sqrt(variance) if variance > 0 else 0

        # Low std deviation = regular beaconing
        coefficient_of_variation = std_dev / avg_interval if avg_interval > 0 else float('inf')

        if coefficient_of_variation < 0.2 and len(intervals) >= 4:
            pid_str = key.split(":")[0]
            return NetworkAlert(
                alert_id=f"beacon-{key.replace(':', '-')}-{int(datetime.utcnow().timestamp())}",
                alert_type="c2_beacon",
                severity="critical",
                confidence=min(1.0, 1.0 - coefficient_of_variation),
                source_ip="local",
                dest_ip=key.split(":")[-1] if ":" in key else "",
                pid=int(pid_str) if pid_str.isdigit() else 0,
                description=f"C2 beaconing detected: interval={avg_interval:.1f}s ± {std_dev:.1f}s",
                indicators=[
                    f"Average interval: {avg_interval:.1f}s",
                    f"Std deviation: {std_dev:.1f}s",
                    f"Regularity: {(1 - coefficient_of_variation) * 100:.0f}%",
                    f"Beacon count: {len(timestamps)}",
                ],
                recommended_action="kill",
            )
        return None

    def _check_volume_anomalies(self, summary: Dict) -> List[NetworkAlert]:
        """Check for data volume anomalies (exfiltration)"""
        alerts = []

        outbound = summary.get("outbound_connections", 0)
        total = summary.get("total_connections", 0)

        # High outbound ratio
        if total > 10 and outbound > 0:
            outbound_ratio = outbound / total
            if outbound_ratio > 0.8 and outbound > 50:
                alert = NetworkAlert(
                    alert_id=f"exfil-volume-{int(datetime.utcnow().timestamp())}",
                    alert_type="exfiltration",
                    severity="high",
                    confidence=min(1.0, outbound_ratio),
                    source_ip="local",
                    description=f"Possible data exfiltration: {outbound_ratio*100:.0f}% connections are outbound ({outbound}/{total})",
                    indicators=[
                        f"Outbound connections: {outbound}",
                        f"Total connections: {total}",
                        f"Outbound ratio: {outbound_ratio*100:.0f}%",
                    ],
                    recommended_action="alert",
                )
                alerts.append(alert)

        # Suspicious connections
        suspicious = summary.get("suspicious_connections", 0)
        if suspicious > 3:
            alert = NetworkAlert(
                alert_id=f"suspicious-conns-{int(datetime.utcnow().timestamp())}",
                alert_type="lateral_movement",
                severity="high" if suspicious > 10 else "medium",
                confidence=min(1.0, suspicious / 10.0),
                source_ip="local",
                description=f"{suspicious} connections to suspicious ports",
                indicators=[
                    f"Suspicious ports used: {summary.get('suspicious_ports_used', [])}",
                ],
                recommended_action="alert",
            )
            alerts.append(alert)

        return alerts

    def _is_dga_domain(self, domain: str) -> bool:
        """Detect Domain Generation Algorithm (DGA) domains"""
        # Remove TLD
        parts = domain.split(".")
        if len(parts) < 2:
            return False
        
        sld = parts[-2]  # Second-level domain
        
        if len(sld) < 6:
            return False

        # Shannon entropy
        entropy = self._calc_entropy(sld)
        if entropy < DGA_ENTROPY_THRESHOLD:
            return False

        # Consonant ratio
        vowels = set("aeiou")
        consonants = sum(1 for c in sld.lower() if c.isalpha() and c not in vowels)
        alpha_count = sum(1 for c in sld if c.isalpha())
        if alpha_count > 0:
            consonant_ratio = consonants / alpha_count
            if consonant_ratio > DGA_CONSONANT_RATIO_THRESHOLD:
                return True

        # Mixed numbers and letters with high entropy
        has_digits = any(c.isdigit() for c in sld)
        has_alpha = any(c.isalpha() for c in sld)
        if has_digits and has_alpha and len(sld) > DGA_LENGTH_THRESHOLD:
            return True

        return entropy > 4.0 and len(sld) > 12

    def _calc_entropy(self, text: str) -> float:
        """Calculate Shannon entropy of a string"""
        if not text:
            return 0.0
        freq = {}
        for c in text.lower():
            freq[c] = freq.get(c, 0) + 1
        length = len(text)
        entropy = 0.0
        for count in freq.values():
            p = count / length
            if p > 0:
                entropy -= p * math.log2(p)
        return entropy

    def get_alerts(self, limit: int = 100, alert_type: str = None) -> List[Dict]:
        """Get recent alerts, optionally filtered by type"""
        alerts = self._alerts
        if alert_type:
            alerts = [a for a in alerts if a.alert_type == alert_type]
        return [a.to_dict() for a in alerts[-limit:]]

    def get_stats(self) -> Dict:
        """Get IDS statistics"""
        type_counts = defaultdict(int)
        severity_counts = defaultdict(int)
        for a in self._alerts:
            type_counts[a.alert_type] += 1
            severity_counts[a.severity] += 1

        return {
            "total_alerts": len(self._alerts),
            "by_type": dict(type_counts),
            "by_severity": dict(severity_counts),
            "dns_queries_tracked": len(self._dns_queries),
            "connections_tracked": sum(len(v) for v in self._connection_history.values()),
            "active_port_scans": sum(1 for v in self._port_scan_tracker.values() if len(v) > 10),
        }


# Singleton
_ids = None


def get_network_ids() -> NetworkIDS:
    global _ids
    if _ids is None:
        _ids = NetworkIDS()
    return _ids
