"""
CyberShield AI - Insider Threat Detection Module
==================================================
Detects internal threats from employees or compromised accounts.

Detection patterns:
- Unusual data access (outside working hours)
- Bulk file downloads/copies
- USB device activity with sensitive files
- Access to unauthorized resources
- Privilege escalation attempts
- Behavioral deviation from baseline
"""

import logging
from datetime import datetime, timedelta, time as dt_time
from typing import Dict, List, Optional, Set, Tuple
from collections import defaultdict
from dataclasses import dataclass, field, asdict

logger = logging.getLogger("cybershield.insider_threat")


# ============================================
# Constants
# ============================================

# Normal working hours (configurable)
WORK_HOURS_START = dt_time(8, 0)   # 8 AM
WORK_HOURS_END = dt_time(20, 0)    # 8 PM

# Sensitive file patterns
SENSITIVE_PATTERNS = {
    "financial": [".xls", ".xlsx", "budget", "salary", "invoice", "financial", "revenue"],
    "hr": ["employee", "personnel", "hr_", "payroll", "benefits", "compensation"],
    "legal": ["contract", "legal", "nda", "agreement", "confidential", "classified"],
    "technical": [".pem", ".key", ".env", "credentials", "password", "secret", "token", ".pfx"],
    "customer": ["customer", "client", "crm", "personal_data", "pii", "gdpr"],
    "source_code": [".git", "source", "repository", ".ssh", "deploy_key"],
}

# Risk weights by data category
CATEGORY_RISK_WEIGHTS = {
    "financial": 0.8,
    "hr": 0.9,
    "legal": 0.85,
    "technical": 0.95,
    "customer": 0.9,
    "source_code": 0.7,
}


@dataclass
class InsiderThreatAlert:
    """Insider threat detection alert"""
    alert_id: str
    threat_type: str          # data_theft, privilege_escalation, unusual_access, policy_violation
    severity: str             # low, medium, high, critical
    confidence: float         # 0.0 - 1.0
    user_id: str
    device_id: str
    description: str
    indicators: List[str]
    data_categories: List[str] = field(default_factory=list)
    files_accessed: int = 0
    recommended_action: str = "investigate"
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self):
        return asdict(self)


@dataclass
class UserBehaviorProfile:
    """Baseline behavior profile for a user"""
    user_id: str
    device_id: str
    avg_files_per_day: float = 20.0
    avg_login_hour: float = 9.0
    avg_logout_hour: float = 18.0
    typical_data_categories: Set[str] = field(default_factory=set)
    typical_access_patterns: Dict[str, int] = field(default_factory=dict)
    total_observations: int = 0
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self):
        d = asdict(self)
        d["typical_data_categories"] = list(self.typical_data_categories)
        return d


class InsiderThreatDetector:
    """
    Detects insider threats by analyzing user behavior patterns.
    
    Detection methods:
    1. Time-based anomalies (access outside working hours)
    2. Volume-based anomalies (bulk downloads/copies)
    3. Category-based anomalies (accessing unusual data types)
    4. Device-based anomalies (USB, external media)
    5. Network-based anomalies (data upload patterns)
    6. Privilege escalation attempts
    """

    def __init__(self):
        self._user_profiles: Dict[str, UserBehaviorProfile] = {}
        self._alerts: List[InsiderThreatAlert] = []
        self._activity_log: Dict[str, List[Dict]] = defaultdict(list)
        logger.info("Insider threat detector initialized")

    def analyze_activity(self, user_id: str, device_id: str,
                        file_activity: Dict = None,
                        network_activity: Dict = None,
                        process_behaviors: List[Dict] = None,
                        current_time: datetime = None) -> List[InsiderThreatAlert]:
        """
        Analyze user activity for insider threat indicators.
        """
        alerts = []
        now = current_time or datetime.utcnow()

        # Get or create user profile
        profile = self._get_or_create_profile(user_id, device_id)

        # 1. Check for after-hours activity
        if file_activity or process_behaviors:
            time_alert = self._check_after_hours(user_id, device_id, now, file_activity)
            if time_alert:
                alerts.append(time_alert)

        # 2. Check for bulk data access
        if file_activity:
            bulk_alert = self._check_bulk_access(user_id, device_id, file_activity, profile)
            if bulk_alert:
                alerts.append(bulk_alert)

        # 3. Check for sensitive data access
        if file_activity:
            sensitive_alerts = self._check_sensitive_access(user_id, device_id, file_activity)
            alerts.extend(sensitive_alerts)

        # 4. Check for USB/external device activity
        if file_activity:
            usb_alert = self._check_usb_activity(user_id, device_id, file_activity)
            if usb_alert:
                alerts.append(usb_alert)

        # 5. Check for data exfiltration via network
        if network_activity:
            exfil_alert = self._check_data_exfiltration(user_id, device_id, network_activity)
            if exfil_alert:
                alerts.append(exfil_alert)

        # 6. Check for privilege escalation
        if process_behaviors:
            priv_alert = self._check_privilege_escalation(user_id, device_id, process_behaviors)
            if priv_alert:
                alerts.append(priv_alert)

        # Log activity
        self._activity_log[user_id].append({
            "timestamp": now.isoformat() + "Z",
            "device_id": device_id,
            "file_events": file_activity.get("total_events", 0) if file_activity else 0,
            "alerts_generated": len(alerts),
        })

        # Update profile
        self._update_profile(profile, file_activity, now)

        self._alerts.extend(alerts)
        return alerts

    def _check_after_hours(self, user_id: str, device_id: str,
                           now: datetime, file_activity: Dict) -> Optional[InsiderThreatAlert]:
        """Check for activity outside working hours"""
        current_time = now.time()

        if current_time < WORK_HOURS_START or current_time > WORK_HOURS_END:
            # Weekend check
            is_weekend = now.weekday() >= 5

            file_events = file_activity.get("total_events", 0) if file_activity else 0
            if file_events > 5 or is_weekend:
                indicators = []
                if is_weekend:
                    indicators.append(f"Weekend activity: {now.strftime('%A')}")
                indicators.append(f"Activity at {current_time.strftime('%I:%M %p')}")
                indicators.append(f"File events: {file_events}")

                severity = "high" if (is_weekend and file_events > 20) else "medium"

                return InsiderThreatAlert(
                    alert_id=f"afterhours-{user_id}-{int(now.timestamp())}",
                    threat_type="unusual_access",
                    severity=severity,
                    confidence=0.6,
                    user_id=user_id,
                    device_id=device_id,
                    description=f"Activity outside working hours ({current_time.strftime('%I:%M %p')})",
                    indicators=indicators,
                    files_accessed=file_events,
                    recommended_action="investigate",
                )
        return None

    def _check_bulk_access(self, user_id: str, device_id: str,
                           file_activity: Dict,
                           profile: UserBehaviorProfile) -> Optional[InsiderThreatAlert]:
        """Check for bulk file access (potential data theft)"""
        total_events = file_activity.get("total_events", 0)
        threshold = max(50, profile.avg_files_per_day * 3)

        if total_events > threshold:
            indicators = [
                f"File operations: {total_events} (baseline: {profile.avg_files_per_day:.0f}/day)",
                f"Created: {file_activity.get('created_count', 0)}",
                f"Modified: {file_activity.get('modified_count', 0)}",
                f"Deleted: {file_activity.get('deleted_count', 0)}",
            ]

            severity = "critical" if total_events > threshold * 3 else "high"

            return InsiderThreatAlert(
                alert_id=f"bulk-{user_id}-{int(datetime.utcnow().timestamp())}",
                threat_type="data_theft",
                severity=severity,
                confidence=min(1.0, total_events / (threshold * 2)),
                user_id=user_id,
                device_id=device_id,
                description=f"Bulk file access: {total_events} operations (3x above baseline)",
                indicators=indicators,
                files_accessed=total_events,
                recommended_action="alert" if severity == "high" else "isolate",
            )
        return None

    def _check_sensitive_access(self, user_id: str, device_id: str,
                                file_activity: Dict) -> List[InsiderThreatAlert]:
        """Check for access to sensitive file categories"""
        alerts = []
        sensitive_count = file_activity.get("sensitive_files_touched", 0)

        if sensitive_count > 3:
            indicators = [
                f"Sensitive files accessed: {sensitive_count}",
            ]

            alert = InsiderThreatAlert(
                alert_id=f"sensitive-{user_id}-{int(datetime.utcnow().timestamp())}",
                threat_type="data_theft",
                severity="high" if sensitive_count > 10 else "medium",
                confidence=min(1.0, sensitive_count / 15),
                user_id=user_id,
                device_id=device_id,
                description=f"Multiple sensitive files accessed: {sensitive_count}",
                indicators=indicators,
                data_categories=["sensitive"],
                files_accessed=sensitive_count,
                recommended_action="investigate",
            )
            alerts.append(alert)

        return alerts

    def _check_usb_activity(self, user_id: str, device_id: str,
                            file_activity: Dict) -> Optional[InsiderThreatAlert]:
        """Check for USB/external device data transfer"""
        # Detect based on file paths containing USB/removable media paths
        # When running, the file watcher can detect writes to /media/, /mnt/, D:, E:, etc.
        renamed = file_activity.get("renamed_count", 0)
        created = file_activity.get("created_count", 0)

        # Simulate USB detection based on high file creation + rename patterns
        if created > 30 and renamed > 10:
            indicators = [
                f"High file copy activity: {created} files created, {renamed} renamed",
                "Pattern consistent with bulk copy to external media",
            ]
            return InsiderThreatAlert(
                alert_id=f"usb-{user_id}-{int(datetime.utcnow().timestamp())}",
                threat_type="data_theft",
                severity="high",
                confidence=0.65,
                user_id=user_id,
                device_id=device_id,
                description="Possible data copy to external media",
                indicators=indicators,
                files_accessed=created,
                recommended_action="investigate",
            )
        return None

    def _check_data_exfiltration(self, user_id: str, device_id: str,
                                  network_activity: Dict) -> Optional[InsiderThreatAlert]:
        """Check for data exfiltration via network"""
        outbound = network_activity.get("outbound_connections", 0)
        total = network_activity.get("total_connections", 0)

        if outbound > 30 and total > 0:
            outbound_ratio = outbound / total
            if outbound_ratio > 0.7:
                indicators = [
                    f"Outbound connections: {outbound}/{total} ({outbound_ratio*100:.0f}%)",
                    "Unusually high outbound traffic ratio",
                ]
                return InsiderThreatAlert(
                    alert_id=f"exfil-net-{user_id}-{int(datetime.utcnow().timestamp())}",
                    threat_type="data_theft",
                    severity="high",
                    confidence=min(1.0, outbound_ratio),
                    user_id=user_id,
                    device_id=device_id,
                    description=f"Possible data exfiltration: {outbound_ratio*100:.0f}% outbound",
                    indicators=indicators,
                    recommended_action="investigate",
                )
        return None

    def _check_privilege_escalation(self, user_id: str, device_id: str,
                                     process_behaviors: List[Dict]) -> Optional[InsiderThreatAlert]:
        """Check for privilege escalation attempts"""
        indicators = []
        score = 0.0

        priv_commands = {"sudo", "su", "runas", "pkexec", "gksu", "doas"}
        admin_tools = {"regedit", "gpedit", "secpol", "lusrmgr", "compmgmt"}

        for proc in process_behaviors:
            name = proc.get("name", "").lower()
            cmdline = (proc.get("cmdline", "") or "").lower()

            if name in priv_commands:
                indicators.append(f"Privilege escalation: {name}")
                score += 30

            if name in admin_tools:
                indicators.append(f"Admin tool usage: {name}")
                score += 20

            # Check for passwd/shadow access
            if ("passwd" in cmdline or "shadow" in cmdline) and name not in ("login", "sshd"):
                indicators.append(f"Password file access: {name}")
                score += 25

        if score >= 30 and indicators:
            return InsiderThreatAlert(
                alert_id=f"privesc-{user_id}-{int(datetime.utcnow().timestamp())}",
                threat_type="privilege_escalation",
                severity="critical" if score >= 50 else "high",
                confidence=min(1.0, score / 80),
                user_id=user_id,
                device_id=device_id,
                description="Privilege escalation activity detected",
                indicators=indicators,
                recommended_action="alert",
            )
        return None

    def _get_or_create_profile(self, user_id: str, device_id: str) -> UserBehaviorProfile:
        """Get or create a user behavior profile"""
        if user_id not in self._user_profiles:
            self._user_profiles[user_id] = UserBehaviorProfile(
                user_id=user_id,
                device_id=device_id,
            )
        return self._user_profiles[user_id]

    def _update_profile(self, profile: UserBehaviorProfile,
                        file_activity: Dict, now: datetime):
        """Update user behavior profile with new observations"""
        if file_activity:
            events = file_activity.get("total_events", 0)
            n = profile.total_observations + 1
            # Running average
            profile.avg_files_per_day = (
                (profile.avg_files_per_day * profile.total_observations + events) / n
            )
            profile.total_observations = n
            profile.last_updated = now.isoformat() + "Z"

    def get_alerts(self, limit: int = 100, user_id: str = None) -> List[Dict]:
        """Get alerts, optionally filtered by user"""
        alerts = self._alerts
        if user_id:
            alerts = [a for a in alerts if a.user_id == user_id]
        return [a.to_dict() for a in alerts[-limit:]]

    def get_user_profiles(self) -> List[Dict]:
        """Get all user behavior profiles"""
        return [p.to_dict() for p in self._user_profiles.values()]

    def get_stats(self) -> Dict:
        """Get insider threat statistics"""
        type_counts = defaultdict(int)
        for a in self._alerts:
            type_counts[a.threat_type] += 1

        return {
            "total_alerts": len(self._alerts),
            "by_type": dict(type_counts),
            "users_monitored": len(self._user_profiles),
            "high_risk_users": sum(
                1 for uid, alerts in
                [(uid, [a for a in self._alerts if a.user_id == uid])
                 for uid in set(a.user_id for a in self._alerts)]
                if len(alerts) > 3
            ),
        }


# Singleton
_detector = None


def get_insider_detector() -> InsiderThreatDetector:
    global _detector
    if _detector is None:
        _detector = InsiderThreatDetector()
    return _detector
