"""
CyberShield AI - Risk Score Engine
====================================
Calculates a simple 0-100 risk score for business owners.

Components:
- Device health score
- Threat exposure score
- Network security score
- User behavior score
- Compliance score
- Vulnerability score

Output: Simple dashboard-friendly risk score with plain English explanations.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from collections import defaultdict

logger = logging.getLogger("cybershield.risk_score")


@dataclass
class RiskFactor:
    """Individual risk factor"""
    name: str
    category: str            # device, network, threat, user, compliance
    score: float             # 0-100 (0 = no risk, 100 = critical risk)
    weight: float            # Importance weight (0-1)
    description: str
    recommendation: str
    severity: str = "low"    # low, medium, high, critical
    trend: str = "stable"    # improving, stable, worsening

    def to_dict(self):
        return asdict(self)


@dataclass
class DeviceRiskProfile:
    """Risk profile for a single device"""
    device_id: str
    device_name: str
    overall_score: float = 0.0       # 0-100 (0 = safe, 100 = critical)
    risk_level: str = "low"          # low, medium, high, critical
    risk_factors: List[RiskFactor] = field(default_factory=list)
    category_scores: Dict[str, float] = field(default_factory=dict)
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    trend: str = "stable"
    recommendations: List[str] = field(default_factory=list)

    def to_dict(self):
        return asdict(self)


@dataclass
class OrganizationRiskSummary:
    """Organization-wide risk summary for dashboard"""
    overall_score: float = 0.0
    risk_level: str = "low"
    total_devices: int = 0
    devices_at_risk: int = 0
    critical_devices: int = 0
    active_threats: int = 0
    top_risks: List[Dict] = field(default_factory=list)
    category_breakdown: Dict[str, float] = field(default_factory=dict)
    trend_7d: str = "stable"
    security_health: str = "Good"
    recommendations: List[str] = field(default_factory=list)
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self):
        return asdict(self)


class RiskScoreEngine:
    """
    Calculates comprehensive risk scores.
    Designed for non-technical business owners.
    """

    CATEGORY_WEIGHTS = {
        "device": 0.25,
        "network": 0.20,
        "threat": 0.25,
        "user": 0.15,
        "compliance": 0.15,
    }

    def __init__(self):
        self._device_profiles: Dict[str, DeviceRiskProfile] = {}
        self._threat_history: List[Dict] = []
        self._score_history: List[Dict] = []
        logger.info("Risk score engine initialized")

    def calculate_device_risk(self, device_id: str, device_name: str,
                              system_metrics: Dict = None,
                              threats: List[Dict] = None,
                              network_data: Dict = None,
                              compliance_data: Dict = None) -> DeviceRiskProfile:
        """
        Calculate comprehensive risk score for a device.
        Returns a simple 0-100 score with recommendations.
        """
        factors = []

        # 1. Device Health Score
        device_score = self._assess_device_health(system_metrics or {})
        factors.extend(device_score)

        # 2. Active Threat Score
        threat_score = self._assess_threats(threats or [])
        factors.extend(threat_score)

        # 3. Network Security Score
        network_score = self._assess_network(network_data or {})
        factors.extend(network_score)

        # 4. Compliance Score
        compliance_factors = self._assess_compliance(compliance_data or {})
        factors.extend(compliance_factors)

        # Calculate overall score
        category_scores = defaultdict(lambda: {"total": 0.0, "count": 0})
        for factor in factors:
            cat = factor.category
            category_scores[cat]["total"] += factor.score * factor.weight
            category_scores[cat]["count"] += factor.weight

        category_averages = {}
        for cat, data in category_scores.items():
            if data["count"] > 0:
                category_averages[cat] = data["total"] / data["count"]
            else:
                category_averages[cat] = 0.0

        # Weighted overall score
        overall = 0.0
        total_weight = 0.0
        for cat, weight in self.CATEGORY_WEIGHTS.items():
            if cat in category_averages:
                overall += category_averages[cat] * weight
                total_weight += weight

        if total_weight > 0:
            overall = overall / total_weight

        # Determine risk level
        risk_level = self._score_to_level(overall)

        # Generate recommendations
        recommendations = self._generate_recommendations(factors, overall)

        # Determine trend
        trend = self._calculate_trend(device_id, overall)

        profile = DeviceRiskProfile(
            device_id=device_id,
            device_name=device_name,
            overall_score=round(overall, 1),
            risk_level=risk_level,
            risk_factors=factors,
            category_scores={k: round(v, 1) for k, v in category_averages.items()},
            trend=trend,
            recommendations=recommendations,
        )

        self._device_profiles[device_id] = profile
        self._score_history.append({
            "device_id": device_id,
            "score": overall,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

        return profile

    def _assess_device_health(self, metrics: Dict) -> List[RiskFactor]:
        """Assess device health risk factors"""
        factors = []

        # CPU usage
        cpu = metrics.get("cpu_percent", 0)
        cpu_score = min(100, cpu * 1.2) if cpu > 50 else cpu * 0.5
        factors.append(RiskFactor(
            name="CPU Usage",
            category="device",
            score=cpu_score,
            weight=0.3,
            description=f"CPU at {cpu:.0f}%",
            recommendation="Investigate high CPU processes" if cpu > 80 else "CPU usage normal",
            severity="high" if cpu > 90 else "medium" if cpu > 70 else "low",
        ))

        # Memory usage
        memory = metrics.get("memory_percent", 0)
        mem_score = min(100, memory * 1.1) if memory > 60 else memory * 0.4
        factors.append(RiskFactor(
            name="Memory Usage",
            category="device",
            score=mem_score,
            weight=0.2,
            description=f"Memory at {memory:.0f}%",
            recommendation="Close unused applications" if memory > 80 else "Memory usage normal",
            severity="high" if memory > 90 else "medium" if memory > 75 else "low",
        ))

        # Disk usage
        disk = metrics.get("disk_percent", 0)
        disk_score = min(100, disk * 1.3) if disk > 70 else disk * 0.3
        factors.append(RiskFactor(
            name="Disk Usage",
            category="device",
            score=disk_score,
            weight=0.2,
            description=f"Disk at {disk:.0f}%",
            recommendation="Free up disk space" if disk > 85 else "Disk usage normal",
            severity="high" if disk > 90 else "medium" if disk > 80 else "low",
        ))

        # Uptime (long uptime = missed security patches)
        boot_time = metrics.get("boot_time", "")
        if boot_time:
            try:
                boot_dt = datetime.fromisoformat(boot_time.replace("Z", "+00:00"))
                uptime_days = (datetime.utcnow().replace(tzinfo=boot_dt.tzinfo) - boot_dt).days
            except Exception:
                uptime_days = 0
            uptime_score = min(100, uptime_days * 3) if uptime_days > 7 else 0
            factors.append(RiskFactor(
                name="System Uptime",
                category="device",
                score=uptime_score,
                weight=0.15,
                description=f"Up for {uptime_days} days",
                recommendation="Reboot to apply security updates" if uptime_days > 14 else "Uptime acceptable",
                severity="medium" if uptime_days > 14 else "low",
            ))

        return factors

    def _assess_threats(self, threats: List[Dict]) -> List[RiskFactor]:
        """Assess active threat risk"""
        factors = []

        if not threats:
            factors.append(RiskFactor(
                name="Active Threats",
                category="threat",
                score=0,
                weight=1.0,
                description="No active threats detected",
                recommendation="Keep monitoring active",
                severity="low",
            ))
            return factors

        # Count by severity
        critical = sum(1 for t in threats if t.get("severity") == "critical")
        high = sum(1 for t in threats if t.get("severity") == "high")
        medium = sum(1 for t in threats if t.get("severity") == "medium")

        threat_score = min(100, critical * 30 + high * 15 + medium * 5 + len(threats) * 2)

        factors.append(RiskFactor(
            name="Active Threats",
            category="threat",
            score=threat_score,
            weight=1.0,
            description=f"{len(threats)} threats: {critical} critical, {high} high, {medium} medium",
            recommendation="Investigate and remediate threats immediately" if critical > 0
                           else "Review detected threats",
            severity="critical" if critical > 0 else "high" if high > 0 else "medium",
        ))

        # Highest anomaly score
        max_anomaly = max((t.get("anomaly_score", 0) for t in threats), default=0)
        if max_anomaly > 0.7:
            factors.append(RiskFactor(
                name="Anomaly Severity",
                category="threat",
                score=max_anomaly * 100,
                weight=0.5,
                description=f"Highest anomaly score: {max_anomaly:.2f}",
                recommendation="Investigate the highest-scoring process",
                severity="critical" if max_anomaly > 0.9 else "high",
            ))

        return factors

    def _assess_network(self, network: Dict) -> List[RiskFactor]:
        """Assess network security risk"""
        factors = []

        suspicious = network.get("suspicious_connections", 0)
        outbound = network.get("outbound_connections", 0)
        total = network.get("total_connections", 0)

        # Suspicious connections
        if suspicious > 0:
            susp_score = min(100, suspicious * 20)
            factors.append(RiskFactor(
                name="Suspicious Connections",
                category="network",
                score=susp_score,
                weight=0.5,
                description=f"{suspicious} suspicious connection(s)",
                recommendation="Block suspicious connections and investigate",
                severity="high" if suspicious > 5 else "medium",
            ))

        # Outbound ratio
        if total > 10:
            outbound_ratio = outbound / total if total > 0 else 0
            if outbound_ratio > 0.7:
                ratio_score = min(100, outbound_ratio * 80)
                factors.append(RiskFactor(
                    name="Outbound Traffic Ratio",
                    category="network",
                    score=ratio_score,
                    weight=0.3,
                    description=f"{outbound_ratio*100:.0f}% outbound ({outbound}/{total})",
                    recommendation="Investigate high outbound traffic",
                    severity="medium",
                ))

        if not factors:
            factors.append(RiskFactor(
                name="Network Status",
                category="network",
                score=10,
                weight=0.3,
                description="Network activity normal",
                recommendation="Continue monitoring",
                severity="low",
            ))

        return factors

    def _assess_compliance(self, compliance: Dict) -> List[RiskFactor]:
        """Assess compliance risk factors"""
        factors = []

        # Default compliance checks if no data provided
        checks = compliance.get("checks", {
            "antivirus_active": True,
            "firewall_enabled": True,
            "auto_updates": True,
            "encryption_enabled": False,
            "password_policy": True,
        })

        failed_checks = sum(1 for v in checks.values() if not v)
        total_checks = len(checks)

        compliance_score = (failed_checks / total_checks * 100) if total_checks > 0 else 0

        factors.append(RiskFactor(
            name="Security Compliance",
            category="compliance",
            score=compliance_score,
            weight=1.0,
            description=f"{total_checks - failed_checks}/{total_checks} checks passed",
            recommendation="Enable missing security controls" if failed_checks > 0
                           else "All compliance checks passed",
            severity="high" if failed_checks > 2 else "medium" if failed_checks > 0 else "low",
        ))

        return factors

    def _score_to_level(self, score: float) -> str:
        """Convert score to risk level"""
        if score >= 75:
            return "critical"
        elif score >= 50:
            return "high"
        elif score >= 25:
            return "medium"
        return "low"

    def _calculate_trend(self, device_id: str, current_score: float) -> str:
        """Calculate score trend"""
        recent = [s for s in self._score_history if s["device_id"] == device_id]
        if len(recent) < 2:
            return "stable"

        prev_score = recent[-2]["score"] if len(recent) >= 2 else current_score
        diff = current_score - prev_score
        if diff > 5:
            return "worsening"
        elif diff < -5:
            return "improving"
        return "stable"

    def _generate_recommendations(self, factors: List[RiskFactor], overall: float) -> List[str]:
        """Generate prioritized recommendations"""
        recs = []
        # Sort factors by score (highest risk first)
        sorted_factors = sorted(factors, key=lambda f: f.score, reverse=True)

        for factor in sorted_factors[:5]:
            if factor.score > 20:
                recs.append(f"[{factor.severity.upper()}] {factor.recommendation}")

        if overall < 25:
            recs.insert(0, "✅ Overall security posture is good")
        elif overall > 75:
            recs.insert(0, "🚨 URGENT: Multiple critical risks require immediate attention")

        return recs

    def get_organization_summary(self) -> OrganizationRiskSummary:
        """Get organization-wide risk summary for dashboard"""
        profiles = list(self._device_profiles.values())

        if not profiles:
            return OrganizationRiskSummary(
                overall_score=0,
                risk_level="low",
                security_health="No devices monitored",
                recommendations=["Connect your first device to start monitoring"],
            )

        total_devices = len(profiles)
        scores = [p.overall_score for p in profiles]
        avg_score = sum(scores) / len(scores) if scores else 0

        devices_at_risk = sum(1 for p in profiles if p.risk_level in ("high", "critical"))
        critical_devices = sum(1 for p in profiles if p.risk_level == "critical")

        # Category breakdown
        cat_scores = defaultdict(list)
        for p in profiles:
            for cat, score in p.category_scores.items():
                cat_scores[cat].append(score)

        category_breakdown = {
            cat: round(sum(s) / len(s), 1)
            for cat, s in cat_scores.items() if s
        }

        # Top risks
        all_factors = []
        for p in profiles:
            for f in p.risk_factors:
                all_factors.append({
                    "device": p.device_name,
                    "risk": f.name,
                    "score": f.score,
                    "severity": f.severity,
                    "recommendation": f.recommendation,
                })
        top_risks = sorted(all_factors, key=lambda x: x["score"], reverse=True)[:5]

        # Health assessment
        if avg_score < 20:
            health = "Excellent"
        elif avg_score < 40:
            health = "Good"
        elif avg_score < 60:
            health = "Fair"
        elif avg_score < 80:
            health = "Poor"
        else:
            health = "Critical"

        # Recommendations
        recs = []
        if critical_devices > 0:
            recs.append(f"🚨 {critical_devices} device(s) at critical risk – investigate immediately")
        if devices_at_risk > 0:
            recs.append(f"⚠️ {devices_at_risk} device(s) need attention")
        if not recs:
            recs.append("✅ All devices are within acceptable risk levels")

        return OrganizationRiskSummary(
            overall_score=round(avg_score, 1),
            risk_level=self._score_to_level(avg_score),
            total_devices=total_devices,
            devices_at_risk=devices_at_risk,
            critical_devices=critical_devices,
            active_threats=sum(1 for f in all_factors if f["severity"] in ("high", "critical")),
            top_risks=top_risks,
            category_breakdown=category_breakdown,
            security_health=health,
            recommendations=recs,
        )

    def get_all_device_profiles(self) -> List[Dict]:
        """Get all device risk profiles"""
        return [p.to_dict() for p in self._device_profiles.values()]


# Singleton
_engine = None


def get_risk_engine() -> RiskScoreEngine:
    global _engine
    if _engine is None:
        _engine = RiskScoreEngine()
    return _engine
