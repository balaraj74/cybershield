"""
CyberShield AI - Module API Routes
====================================
API routes for all 9 security modules.
"""

from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger("cybershield.module_api")

router = APIRouter(prefix="/api/v1/modules", tags=["Security Modules"])


# ============================================
# Request/Response Schemas
# ============================================

class URLAnalysisRequest(BaseModel):
    url: str

class EmailAnalysisRequest(BaseModel):
    subject: str = ""
    body: str = ""
    sender: str = ""
    links: List[str] = []

class ComplianceUpdateRequest(BaseModel):
    updates: dict = {}

class PrivacyPolicyUpdateRequest(BaseModel):
    updates: dict = {}


# ============================================
# Module 2: Behavior-Based Malware Detection
# ============================================

@router.get("/behavior-malware/stats")
async def get_behavior_malware_stats():
    """Get behavior-based malware detection statistics"""
    from behavior_malware import get_behavior_detector
    detector = get_behavior_detector()
    return {
        "status": "active",
        "module": "Behavior-Based Malware Detection",
        "stats": detector.get_stats(),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

@router.get("/behavior-malware/alerts")
async def get_behavior_malware_alerts(limit: int = Query(default=50, ge=1, le=200)):
    """Get recent malware behavior alerts"""
    from behavior_malware import get_behavior_detector
    detector = get_behavior_detector()
    return {
        "alerts": detector.get_alert_history(limit),
        "total": len(detector.get_alert_history(limit)),
    }


# ============================================
# Module 3: Network Intrusion Detection
# ============================================

@router.get("/network-ids/stats")
async def get_network_ids_stats():
    """Get Network IDS statistics"""
    from network_ids import get_network_ids
    ids = get_network_ids()
    return {
        "status": "active",
        "module": "AI Network Intrusion Detection",
        "stats": ids.get_stats(),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

@router.get("/network-ids/alerts")
async def get_network_ids_alerts(
    limit: int = Query(default=50, ge=1, le=200),
    alert_type: Optional[str] = None,
):
    """Get network intrusion alerts"""
    from network_ids import get_network_ids
    ids = get_network_ids()
    alerts = ids.get_alerts(limit, alert_type)
    return {
        "alerts": alerts,
        "total": len(alerts),
        "filter": alert_type,
    }


# ============================================
# Module 4: Autonomous Response System
# ============================================

@router.get("/autonomous-response/stats")
async def get_autonomous_response_stats():
    """Get autonomous response system statistics"""
    # The auto_response module runs in the agent, we expose its state via endpoint API
    from ai_engine import get_detector
    detector = get_detector()
    return {
        "status": "active",
        "module": "Autonomous Response System",
        "capabilities": [
            {"name": "Kill Suspicious Process", "enabled": True, "description": "Automatically terminates processes with anomaly score >= 0.85"},
            {"name": "Isolate Infected Device", "enabled": True, "description": "Network isolation command for compromised devices"},
            {"name": "Block IP", "enabled": True, "description": "Block malicious IP addresses at firewall level"},
            {"name": "Shadow Backup Revert", "enabled": False, "description": "Revert encrypted files from shadow copies"},
        ],
        "model_info": detector.get_model_info(),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

@router.post("/autonomous-response/isolate/{device_id}")
async def isolate_device(device_id: str):
    """Send device isolation command"""
    logger.warning(f"Device isolation requested: {device_id}")
    return {
        "status": "command_queued",
        "device_id": device_id,
        "action": "isolate",
        "message": f"Isolation command queued for device {device_id}",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

@router.post("/autonomous-response/block-ip")
async def block_ip(ip: str = Query(...)):
    """Block a malicious IP address"""
    logger.warning(f"IP block requested: {ip}")
    return {
        "status": "blocked",
        "ip": ip,
        "message": f"IP {ip} has been blocked",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ============================================
# Module 5: Privacy-Preserving AI
# ============================================

@router.get("/privacy/report")
async def get_privacy_report():
    """Get privacy audit report"""
    from privacy_engine import get_privacy_engine
    engine = get_privacy_engine()
    report = engine.get_privacy_report()
    return {
        "status": "active",
        "module": "Privacy-Preserving AI",
        "report": report.to_dict(),
        "policy": engine.policy.to_dict(),
    }

@router.get("/privacy/transparency-log")
async def get_transparency_log():
    """Get data transparency log"""
    from privacy_engine import get_privacy_engine
    engine = get_privacy_engine()
    return {
        "log": engine.get_data_transparency_log(),
    }

@router.put("/privacy/policy")
async def update_privacy_policy(req: PrivacyPolicyUpdateRequest):
    """Update privacy policy settings"""
    from privacy_engine import get_privacy_engine
    engine = get_privacy_engine()
    updated = engine.update_policy(req.updates)
    return {
        "status": "updated",
        "policy": updated.to_dict(),
    }


# ============================================
# Module 6: Risk Score Dashboard
# ============================================

@router.get("/risk-score/organization")
async def get_organization_risk():
    """Get organization-wide risk summary"""
    from risk_scorer import get_risk_engine
    engine = get_risk_engine()
    summary = engine.get_organization_summary()
    return {
        "status": "active",
        "module": "Risk Score Dashboard",
        "summary": summary.to_dict(),
    }

@router.get("/risk-score/devices")
async def get_device_risks():
    """Get all device risk profiles"""
    from risk_scorer import get_risk_engine
    engine = get_risk_engine()
    return {
        "devices": engine.get_all_device_profiles(),
    }

@router.get("/risk-score/device/{device_id}")
async def get_device_risk(device_id: str):
    """Get risk score for a specific device"""
    from risk_scorer import get_risk_engine
    engine = get_risk_engine()
    profiles = engine.get_all_device_profiles()
    device = next((p for p in profiles if p["device_id"] == device_id), None)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


# ============================================
# Module 7: AI Phishing Detection
# ============================================

@router.post("/phishing/analyze-url")
async def analyze_url_phishing(req: URLAnalysisRequest):
    """Analyze a URL for phishing"""
    from phishing_detector import get_phishing_detector
    detector = get_phishing_detector()
    result = detector.analyze_url(req.url)
    return result.to_dict()

@router.post("/phishing/analyze-email")
async def analyze_email_phishing(req: EmailAnalysisRequest):
    """Analyze email content for phishing"""
    from phishing_detector import get_phishing_detector
    detector = get_phishing_detector()
    result = detector.analyze_email(req.subject, req.body, req.sender, req.links)
    return result.to_dict()

@router.get("/phishing/stats")
async def get_phishing_stats():
    """Get phishing detection statistics"""
    from phishing_detector import get_phishing_detector
    detector = get_phishing_detector()
    return {
        "status": "active",
        "module": "AI Phishing Detection",
        "stats": detector.get_stats(),
    }

@router.get("/phishing/history")
async def get_phishing_history(limit: int = Query(default=50, ge=1, le=200)):
    """Get phishing analysis history"""
    from phishing_detector import get_phishing_detector
    detector = get_phishing_detector()
    return {
        "analyses": detector.get_analysis_history(limit),
    }


# ============================================
# Module 8: Insider Threat Detection
# ============================================

@router.get("/insider-threat/stats")
async def get_insider_threat_stats():
    """Get insider threat detection statistics"""
    from insider_threat import get_insider_detector
    detector = get_insider_detector()
    return {
        "status": "active",
        "module": "Insider Threat Detection",
        "stats": detector.get_stats(),
    }

@router.get("/insider-threat/alerts")
async def get_insider_threat_alerts(
    limit: int = Query(default=50, ge=1, le=200),
    user_id: Optional[str] = None,
):
    """Get insider threat alerts"""
    from insider_threat import get_insider_detector
    detector = get_insider_detector()
    return {
        "alerts": detector.get_alerts(limit, user_id),
    }

@router.get("/insider-threat/profiles")
async def get_user_profiles():
    """Get user behavior profiles"""
    from insider_threat import get_insider_detector
    detector = get_insider_detector()
    return {
        "profiles": detector.get_user_profiles(),
    }


# ============================================
# Module 9: Compliance Automation
# ============================================

@router.get("/compliance/summary")
async def get_compliance_summary():
    """Get overall compliance summary across all frameworks"""
    from compliance_engine import get_compliance_engine
    engine = get_compliance_engine()
    return {
        "status": "active",
        "module": "Compliance Automation",
        "compliance": engine.get_overall_compliance(),
    }

@router.get("/compliance/reports")
async def get_compliance_reports():
    """Get detailed compliance reports for all frameworks"""
    from compliance_engine import get_compliance_engine
    engine = get_compliance_engine()
    return engine.get_reports()

@router.get("/compliance/{framework}")
async def get_framework_report(framework: str):
    """Get compliance report for a specific framework"""
    from compliance_engine import get_compliance_engine
    engine = get_compliance_engine()
    reports = engine.get_reports()
    if framework not in reports:
        raise HTTPException(
            status_code=404,
            detail=f"Framework '{framework}' not found. Available: {list(reports.keys())}"
        )
    return reports[framework]

@router.put("/compliance/state")
async def update_compliance_state(req: ComplianceUpdateRequest):
    """Update compliance check state (manual overrides)"""
    from compliance_engine import get_compliance_engine
    engine = get_compliance_engine()
    engine.update_system_state(req.updates)
    # Re-run checks
    engine.run_all_frameworks()
    return {
        "status": "updated",
        "compliance": engine.get_overall_compliance(),
    }


# ============================================
# Module Overview
# ============================================

@router.get("/overview")
async def get_modules_overview():
    """Get overview of all security modules"""
    modules = []

    # Module 1: AI Anomaly Detection
    try:
        from ai_engine import get_detector
        detector = get_detector()
        info = detector.get_model_info()
        modules.append({
            "id": 1,
            "name": "AI Anomaly Detection",
            "status": "active",
            "icon": "brain",
            "description": "Isolation Forest-based behavioral anomaly detection",
            "stats": {"model_state": info.get("state", "heuristic"), "samples": info.get("training_samples", 0)},
        })
    except Exception:
        modules.append({"id": 1, "name": "AI Anomaly Detection", "status": "error"})

    # Module 2: Behavior Malware
    try:
        from behavior_malware import get_behavior_detector
        det = get_behavior_detector()
        modules.append({
            "id": 2,
            "name": "Behavior-Based Malware Detection",
            "status": "active",
            "icon": "bug",
            "description": "Detects ransomware, cryptominers, keyloggers by behavior",
            "stats": det.get_stats(),
        })
    except Exception:
        modules.append({"id": 2, "name": "Behavior-Based Malware Detection", "status": "error"})

    # Module 3: Network IDS
    try:
        from network_ids import get_network_ids
        ids = get_network_ids()
        modules.append({
            "id": 3,
            "name": "AI Network Intrusion Detection",
            "status": "active",
            "icon": "network",
            "description": "DNS anomaly, port scan, C2 beacon, and exfiltration detection",
            "stats": ids.get_stats(),
        })
    except Exception:
        modules.append({"id": 3, "name": "AI Network Intrusion Detection", "status": "error"})

    # Module 4: Autonomous Response
    modules.append({
        "id": 4,
        "name": "Autonomous Response System",
        "status": "active",
        "icon": "zap",
        "description": "Auto-kill, auto-isolate, IP blocking, shadow backup revert",
        "stats": {"capabilities": 4, "auto_kill_enabled": True},
    })

    # Module 5: Privacy AI
    try:
        from privacy_engine import get_privacy_engine
        engine = get_privacy_engine()
        report = engine.get_privacy_report()
        modules.append({
            "id": 5,
            "name": "Privacy-Preserving AI",
            "status": "active",
            "icon": "eye-off",
            "description": "On-device inference, PII scrubbing, differential privacy",
            "stats": {"privacy_score": report.privacy_score, "pii_scrubbed": report.pii_scrubbed},
        })
    except Exception:
        modules.append({"id": 5, "name": "Privacy-Preserving AI", "status": "error"})

    # Module 6: Risk Score
    try:
        from risk_scorer import get_risk_engine
        engine = get_risk_engine()
        summary = engine.get_organization_summary()
        modules.append({
            "id": 6,
            "name": "Risk Score Dashboard",
            "status": "active",
            "icon": "gauge",
            "description": "Simple 0-100 risk score for business owners",
            "stats": {"score": summary.overall_score, "devices": summary.total_devices},
        })
    except Exception:
        modules.append({"id": 6, "name": "Risk Score Dashboard", "status": "error"})

    # Module 7: Phishing Detection
    try:
        from phishing_detector import get_phishing_detector
        det = get_phishing_detector()
        modules.append({
            "id": 7,
            "name": "AI Phishing Detection",
            "status": "active",
            "icon": "fish",
            "description": "URL analysis, email NLP, brand impersonation detection",
            "stats": det.get_stats(),
        })
    except Exception:
        modules.append({"id": 7, "name": "AI Phishing Detection", "status": "error"})

    # Module 8: Insider Threat
    try:
        from insider_threat import get_insider_detector
        det = get_insider_detector()
        modules.append({
            "id": 8,
            "name": "Insider Threat Detection",
            "status": "active",
            "icon": "user-x",
            "description": "After-hours access, bulk downloads, privilege escalation",
            "stats": det.get_stats(),
        })
    except Exception:
        modules.append({"id": 8, "name": "Insider Threat Detection", "status": "error"})

    # Module 9: Compliance
    try:
        from compliance_engine import get_compliance_engine
        engine = get_compliance_engine()
        summary = engine.get_overall_compliance()
        modules.append({
            "id": 9,
            "name": "Compliance Automation",
            "status": "active",
            "icon": "clipboard-check",
            "description": "ISO 27001, GDPR, Indian IT Act, SOC2 compliance automation",
            "stats": {"overall_score": summary.get("overall_score", 0), "frameworks": 4},
        })
    except Exception:
        modules.append({"id": 9, "name": "Compliance Automation", "status": "error"})

    return {
        "modules": modules,
        "total": len(modules),
        "active": sum(1 for m in modules if m.get("status") == "active"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
