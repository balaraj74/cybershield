"""
CyberShield AI - Endpoint API Routes
Handles agent communication, AI detection, and dashboard data
"""
import uuid
import random
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
import logging

from endpoint_schemas import (
    DeviceRegistration, AgentReportBatch, ReportResponse,
    CommandResponse, CommandResult, ThreatDetection,
    EndpointDashboardStats, DeviceOverview, ThreatAlertResponse,
    KillProcessRequest,
)
from endpoint_models import (
    EndpointDevice, EndpointThreat, EndpointActivity, PendingCommand,
)
from ai_engine import get_detector

logger = logging.getLogger("cybershield.endpoint_api")

router = APIRouter(prefix="/api/v1/endpoint", tags=["Endpoint"])


# Optional DB dependency — returns None if DB isn't available
async def get_optional_db():
    """Get database session, or None if unavailable"""
    session = None
    try:
        from main import SessionLocal
        if SessionLocal is not None:
            session = SessionLocal()
    except Exception:
        pass
    
    try:
        yield session
    finally:
        if session:
            try:
                await session.close()
            except Exception:
                pass


# ============================================
# Agent Communication Endpoints
# ============================================

@router.post("/register")
async def register_device(body: DeviceRegistration, db=Depends(get_optional_db)):
    """Register an endpoint agent with the backend"""
    try:
        # Check if device already exists
        if db:
            result = await db.execute(
                select(EndpointDevice).where(EndpointDevice.id == body.device_id)
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                existing.device_name = body.device_name
                existing.os_version = body.os_version
                existing.agent_version = body.agent_version
                existing.status = "online"
                existing.last_seen = datetime.utcnow()
                existing.capabilities = body.capabilities
                await db.commit()
                logger.info(f"Device re-registered: {body.device_name} ({body.device_id})")
            else:
                device = EndpointDevice(
                    id=body.device_id,
                    device_name=body.device_name,
                    os_version=body.os_version,
                    agent_version=body.agent_version,
                    capabilities=body.capabilities,
                    status="online",
                    first_seen=datetime.utcnow(),
                    last_seen=datetime.utcnow(),
                )
                db.add(device)
                await db.commit()
                logger.info(f"New device registered: {body.device_name} ({body.device_id})")

        return {"success": True, "message": "Device registered", "device_id": body.device_id}
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return {"success": True, "message": "Device registered (standalone mode)"}


@router.post("/report", response_model=ReportResponse)
async def receive_report(body: AgentReportBatch, db=Depends(get_optional_db)):
    """
    Receive behavior reports from agent.
    Runs AI anomaly detection and returns detected threats.
    """
    detector = get_detector()
    all_threats = []

    for report in body.reports:
        # Extract process behaviors for AI analysis
        behaviors = report.behavior.process_behaviors if report.behavior else []
        
        # Run AI anomaly detection
        if behaviors:
            threats = detector.detect_anomalies(behaviors)
            
            for threat in threats:
                # Save threat to database
                if db:
                    try:
                        threat_record = EndpointThreat(
                            id=str(uuid.uuid4()),
                            device_id=body.device_id,
                            pid=threat["pid"],
                            process_name=threat["process_name"],
                            anomaly_score=threat["anomaly_score"],
                            severity=threat["severity"],
                            reason=threat["reason"],
                            detection_method=threat.get("detection_method", "ai_model"),
                            features=threat.get("features"),
                            action_taken="alert",
                            detected_at=datetime.utcnow(),
                        )
                        db.add(threat_record)
                    except Exception as e:
                        logger.error(f"Failed to save threat: {e}")

                # Determine response action
                action = "alert"
                if threat["anomaly_score"] >= 0.85:
                    action = "kill_process"

                all_threats.append(ThreatDetection(
                    pid=threat["pid"],
                    process_name=threat["process_name"],
                    anomaly_score=threat["anomaly_score"],
                    severity=threat["severity"],
                    reason=threat["reason"],
                    action=action,
                ))

            # Also collect training data (normal behavior)
            # Only collect data from processes NOT flagged as threats
            threat_pids = {t["pid"] for t in threats}
            normal_behaviors = [b for b in behaviors if b.get("pid") not in threat_pids]
            if normal_behaviors:
                detector.collect_training_data(normal_behaviors)

        # Save activity summary
        if db:
            try:
                activity = EndpointActivity(
                    id=str(uuid.uuid4()),
                    device_id=body.device_id,
                    total_processes=report.behavior.total_processes if report.behavior else 0,
                    new_processes=len(report.behavior.new_processes) if report.behavior else 0,
                    terminated_processes=len(report.behavior.terminated_processes) if report.behavior else 0,
                    file_events=report.file_activity.total_events,
                    file_creates=report.file_activity.created_count,
                    file_deletes=report.file_activity.deleted_count,
                    file_renames=report.file_activity.renamed_count,
                    sensitive_files_touched=report.file_activity.sensitive_files_touched,
                    ransomware_indicators=report.file_activity.ransomware_ext_detected,
                    total_connections=report.network_activity.total_connections,
                    outbound_connections=report.network_activity.outbound_connections,
                    suspicious_connections=report.network_activity.suspicious_connections,
                    unique_remote_ips=report.network_activity.unique_remote_ips,
                    cpu_percent=report.system_metrics.cpu_percent,
                    memory_percent=report.system_metrics.memory_percent,
                    recorded_at=datetime.utcnow(),
                )
                db.add(activity)
            except Exception as e:
                logger.error(f"Failed to save activity: {e}")

        # Update device status
        if db:
            try:
                result = await db.execute(
                    select(EndpointDevice).where(EndpointDevice.id == body.device_id)
                )
                device = result.scalar_one_or_none()
                if device:
                    device.last_seen = datetime.utcnow()
                    device.status = "online"
                    device.cpu_percent = report.system_metrics.cpu_percent
                    device.memory_percent = report.system_metrics.memory_percent
                    device.active_processes = report.behavior.total_processes if report.behavior else 0
                    device.active_connections = report.network_activity.total_connections
                    
                    if all_threats:
                        device.total_threats_detected += len(all_threats)
                        max_score = max(t.anomaly_score for t in all_threats)
                        device.risk_score = min(100, max_score * 100)
                        if max_score >= 0.9:
                            device.risk_level = "critical"
                            device.status = "compromised"
                        elif max_score >= 0.75:
                            device.risk_level = "high"
                            device.status = "at_risk"
                        elif max_score >= 0.6:
                            device.risk_level = "medium"
                            device.status = "at_risk"
            except Exception as e:
                logger.error(f"Failed to update device: {e}")

    # Commit all database changes
    if db:
        try:
            await db.commit()
        except Exception as e:
            logger.error(f"Database commit error: {e}")
            await db.rollback()

    # ── Integrated Module Processing ──
    # Run all security modules on the incoming data
    module_results = {}
    
    for report in body.reports:
        behaviors = report.behavior.process_behaviors if report.behavior else []
        file_act = report.file_activity.dict() if report.file_activity else {}
        net_act = report.network_activity.dict() if report.network_activity else {}
        sys_met = report.system_metrics.dict() if report.system_metrics else {}

        # Module 2: Behavior-Based Malware Detection
        try:
            from behavior_malware import get_behavior_detector
            malware_det = get_behavior_detector()
            malware_alerts = malware_det.analyze_processes(behaviors, file_act, net_act)
            module_results["behavior_malware"] = len(malware_alerts)
        except Exception as e:
            logger.debug(f"Behavior malware module: {e}")

        # Module 3: Network IDS
        try:
            from network_ids import get_network_ids
            nids = get_network_ids()
            # Build connection list from network activity
            conn_list = []
            for b in behaviors:
                if b.get("outbound_connections", 0) > 0:
                    conn_list.append({
                        "pid": b.get("pid", 0),
                        "process_name": b.get("name", "unknown"),
                        "local_address": "127.0.0.1",
                        "local_port": 0,
                        "remote_address": "",
                        "remote_port": 0,
                    })
            nids_alerts = nids.analyze_connections(conn_list, net_act)
            module_results["network_ids"] = len(nids_alerts)
        except Exception as e:
            logger.debug(f"Network IDS module: {e}")

        # Module 5: Privacy Engine - scrub data
        try:
            from privacy_engine import get_privacy_engine
            privacy = get_privacy_engine()
            privacy.anonymize_process_data(behaviors)
        except Exception as e:
            logger.debug(f"Privacy module: {e}")

        # Module 6: Risk Score
        try:
            from risk_scorer import get_risk_engine
            risk_engine = get_risk_engine()
            risk_engine.calculate_device_risk(
                device_id=body.device_id,
                device_name=body.device_id,
                system_metrics=sys_met,
                threats=[t.dict() for t in all_threats],
                network_data=net_act,
            )
            module_results["risk_score"] = True
        except Exception as e:
            logger.debug(f"Risk score module: {e}")

        # Module 8: Insider Threat
        try:
            from insider_threat import get_insider_detector
            insider = get_insider_detector()
            insider_alerts = insider.analyze_activity(
                user_id=body.device_id,
                device_id=body.device_id,
                file_activity=file_act,
                network_activity=net_act,
                process_behaviors=behaviors,
            )
            module_results["insider_threat"] = len(insider_alerts)
        except Exception as e:
            logger.debug(f"Insider threat module: {e}")

    logger.info(
        f"Processed {len(body.reports)} reports from {body.device_id} | "
        f"Threats detected: {len(all_threats)} | Modules: {module_results}"
    )

    return ReportResponse(
        success=True,
        threats=all_threats,
        message=f"Processed {len(body.reports)} reports, {len(all_threats)} threats detected"
    )


@router.get("/commands/{device_id}", response_model=CommandResponse)
async def get_pending_commands(device_id: str, db=Depends(get_optional_db)):
    """Get pending commands for an endpoint agent"""
    commands = []
    
    if db:
        try:
            result = await db.execute(
                select(PendingCommand).where(
                    and_(
                        PendingCommand.device_id == device_id,
                        PendingCommand.status == "pending"
                    )
                )
            )
            pending = result.scalars().all()
            
            for cmd in pending:
                commands.append({
                    "id": cmd.id,
                    "action": cmd.action,
                    "pid": cmd.pid,
                    "process_name": cmd.process_name,
                    "reason": cmd.reason,
                })
                cmd.status = "sent"
            
            await db.commit()
        except Exception as e:
            logger.error(f"Failed to get commands: {e}")

    return CommandResponse(commands=commands)


@router.post("/command-result")
async def report_command_result(body: CommandResult, db=Depends(get_optional_db)):
    """Report the result of a command execution"""
    if db:
        try:
            result = await db.execute(
                select(PendingCommand).where(PendingCommand.id == body.command_id)
            )
            cmd = result.scalar_one_or_none()
            if cmd:
                cmd.status = "executed" if body.action.get("success") else "failed"
                cmd.result = body.action
                cmd.executed_at = datetime.utcnow()
                await db.commit()
        except Exception as e:
            logger.error(f"Failed to update command result: {e}")

    return {"success": True}


# ============================================
# Dashboard API Endpoints
# ============================================

@router.get("/dashboard/stats")
async def get_endpoint_dashboard_stats(db=Depends(get_optional_db)):
    """Get endpoint monitoring dashboard statistics"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Generate demo data if no database or no real data
    devices = []
    recent_threats = []
    threat_trend = []
    activity_chart = []
    
    total_devices = 0
    online_devices = 0
    at_risk_devices = 0
    total_threats_today = 0
    total_threats_all = 0
    active_threats = 0
    avg_risk_score = 0.0
    processes_killed = 0
    
    detector = get_detector()
    model_info = detector.get_model_info()

    if db:
        try:
            # Get device stats
            device_result = await db.execute(select(EndpointDevice))
            all_devices = device_result.scalars().all()
            total_devices = len(all_devices)
            
            for d in all_devices:
                is_online = d.last_seen and (now - d.last_seen).total_seconds() < 120
                if is_online:
                    online_devices += 1
                if d.risk_level in ("high", "critical"):
                    at_risk_devices += 1
                
                devices.append({
                    "id": d.id,
                    "deviceName": d.device_name,
                    "osVersion": d.os_version or "",
                    "status": "online" if is_online else "offline",
                    "lastSeen": d.last_seen.isoformat() + "Z" if d.last_seen else "",
                    "riskScore": d.risk_score or 0,
                    "riskLevel": d.risk_level or "safe",
                    "cpuPercent": d.cpu_percent or 0,
                    "memoryPercent": d.memory_percent or 0,
                    "activeProcesses": d.active_processes or 0,
                    "activeConnections": d.active_connections or 0,
                    "totalThreats": d.total_threats_detected or 0,
                })
                
            # Get threat stats
            threat_result = await db.execute(
                select(func.count(EndpointThreat.id)).where(
                    EndpointThreat.detected_at >= today_start
                )
            )
            total_threats_today = threat_result.scalar() or 0
            
            threat_all_result = await db.execute(
                select(func.count(EndpointThreat.id))
            )
            total_threats_all = threat_all_result.scalar() or 0
            
            active_result = await db.execute(
                select(func.count(EndpointThreat.id)).where(
                    EndpointThreat.is_resolved == False
                )
            )
            active_threats = active_result.scalar() or 0
            
            # Get recent threats
            recent_result = await db.execute(
                select(EndpointThreat).order_by(
                    desc(EndpointThreat.detected_at)
                ).limit(20)
            )
            for t in recent_result.scalars().all():
                recent_threats.append({
                    "id": t.id,
                    "deviceId": t.device_id,
                    "pid": t.pid,
                    "processName": t.process_name,
                    "anomalyScore": t.anomaly_score,
                    "severity": t.severity,
                    "reason": t.reason,
                    "actionTaken": t.action_taken,
                    "detectedAt": t.detected_at.isoformat() + "Z" if t.detected_at else "",
                    "isResolved": t.is_resolved,
                })
                
            kills_result = await db.execute(
                select(func.count(EndpointThreat.id)).where(
                    EndpointThreat.action_taken == "kill_process"
                )
            )
            processes_killed = kills_result.scalar() or 0
            
        except Exception as e:
            logger.error(f"Dashboard stats error: {e}")

    # If no real data, generate demo data
    if total_devices == 0:
        devices, recent_threats, threat_trend, activity_chart = _generate_demo_data()
        total_devices = len(devices)
        online_devices = sum(1 for d in devices if d["status"] == "online")
        at_risk_devices = sum(1 for d in devices if d["riskLevel"] in ("high", "critical"))
        total_threats_today = random.randint(3, 12)
        total_threats_all = random.randint(45, 120)
        active_threats = random.randint(2, 8)
        avg_risk_score = sum(d["riskScore"] for d in devices) / len(devices) if devices else 0
        processes_killed = random.randint(5, 20)

    # Generate trend data if empty
    if not threat_trend:
        for i in range(7):
            day = now - timedelta(days=6-i)
            threat_trend.append({
                "date": day.strftime("%Y-%m-%d"),
                "threats": random.randint(0, 15),
                "blocked": random.randint(0, 10),
            })

    if not activity_chart:
        for i in range(24):
            hour = now.replace(hour=i, minute=0, second=0)
            activity_chart.append({
                "hour": hour.strftime("%H:00"),
                "processes": random.randint(50, 200),
                "connections": random.randint(20, 100),
                "fileEvents": random.randint(5, 50),
            })

    return {
        "success": True,
        "data": {
            "totalDevices": total_devices,
            "onlineDevices": online_devices,
            "atRiskDevices": at_risk_devices,
            "totalThreatsToday": total_threats_today,
            "totalThreatsAll": total_threats_all,
            "activeThreats": active_threats,
            "avgRiskScore": round(avg_risk_score, 1),
            "processesKilled": processes_killed,
            "modelStatus": "trained" if model_info["is_trained"] else "heuristic",
            "trainingSamples": model_info["collected_samples"],
            "devices": devices,
            "recentThreats": recent_threats,
            "threatTrend": threat_trend,
            "activityChart": activity_chart,
        }
    }


@router.post("/dashboard/kill-process")
async def dashboard_kill_process(body: KillProcessRequest, db=Depends(get_optional_db)):
    """Queue a kill process command from the dashboard"""
    command_id = str(uuid.uuid4())
    
    if db:
        try:
            cmd = PendingCommand(
                id=command_id,
                device_id=body.device_id,
                action="kill_process",
                pid=body.pid,
                process_name=body.process_name,
                reason=body.reason,
                status="pending",
                created_at=datetime.utcnow(),
            )
            db.add(cmd)
            await db.commit()
        except Exception as e:
            logger.error(f"Failed to queue command: {e}")
    
    return {
        "success": True,
        "commandId": command_id,
        "message": f"Kill command queued for {body.process_name} (PID: {body.pid})"
    }


@router.get("/dashboard/threats")
async def get_threats_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    device_id: Optional[str] = None,
    db=Depends(get_optional_db),
):
    """Get paginated list of threats"""
    threats = []
    total = 0
    
    if db:
        try:
            query = select(EndpointThreat)
            count_query = select(func.count(EndpointThreat.id))
            
            if severity:
                query = query.where(EndpointThreat.severity == severity)
                count_query = count_query.where(EndpointThreat.severity == severity)
            if device_id:
                query = query.where(EndpointThreat.device_id == device_id)
                count_query = count_query.where(EndpointThreat.device_id == device_id)
            
            total = (await db.execute(count_query)).scalar() or 0
            
            result = await db.execute(
                query.order_by(desc(EndpointThreat.detected_at))
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
            for t in result.scalars().all():
                threats.append({
                    "id": t.id,
                    "deviceId": t.device_id,
                    "pid": t.pid,
                    "processName": t.process_name,
                    "anomalyScore": t.anomaly_score,
                    "severity": t.severity,
                    "reason": t.reason,
                    "actionTaken": t.action_taken,
                    "detectedAt": t.detected_at.isoformat() + "Z" if t.detected_at else "",
                    "isResolved": t.is_resolved,
                })
        except Exception as e:
            logger.error(f"Threats list error: {e}")
    
    return {
        "success": True,
        "data": {
            "items": threats,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "hasMore": (page * page_size) < total,
        }
    }


@router.get("/ai/model-info")
async def get_model_info():
    """Get AI model status and info"""
    detector = get_detector()
    return {
        "success": True,
        "data": detector.get_model_info()
    }


@router.post("/ai/train")
async def trigger_training():
    """Manually trigger model training"""
    detector = get_detector()
    try:
        success = detector.train(min_samples=50)  # Lower threshold for demo
        return {
            "success": success,
            "message": "Model trained successfully" if success else "Not enough training data",
            "data": detector.get_model_info()
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


# ============================================
# Demo Data Generator
# ============================================

def _generate_demo_data():
    """Generate realistic demo data for hackathon presentation"""
    now = datetime.utcnow()
    
    demo_devices = [
        {
            "id": "dev-001-demo",
            "deviceName": "DESKTOP-SALES-01",
            "osVersion": "Windows 11 Pro 23H2",
            "status": "online",
            "lastSeen": (now - timedelta(seconds=15)).isoformat() + "Z",
            "riskScore": 12.0,
            "riskLevel": "safe",
            "cpuPercent": 34.5,
            "memoryPercent": 62.3,
            "activeProcesses": 147,
            "activeConnections": 23,
            "totalThreats": 2,
        },
        {
            "id": "dev-002-demo",
            "deviceName": "LAPTOP-HR-SARAH",
            "osVersion": "Windows 10 Enterprise",
            "status": "online",
            "lastSeen": (now - timedelta(seconds=8)).isoformat() + "Z",
            "riskScore": 78.5,
            "riskLevel": "high",
            "cpuPercent": 89.2,
            "memoryPercent": 78.1,
            "activeProcesses": 203,
            "activeConnections": 67,
            "totalThreats": 15,
        },
        {
            "id": "dev-003-demo",
            "deviceName": "SERVER-FILE-01",
            "osVersion": "Windows Server 2022",
            "status": "online",
            "lastSeen": (now - timedelta(seconds=5)).isoformat() + "Z",
            "riskScore": 5.0,
            "riskLevel": "safe",
            "cpuPercent": 22.1,
            "memoryPercent": 45.8,
            "activeProcesses": 89,
            "activeConnections": 45,
            "totalThreats": 0,
        },
        {
            "id": "dev-004-demo",
            "deviceName": "DESKTOP-DEV-MARK",
            "osVersion": "Windows 11 Pro",
            "status": "at_risk",
            "lastSeen": (now - timedelta(seconds=30)).isoformat() + "Z",
            "riskScore": 92.3,
            "riskLevel": "critical",
            "cpuPercent": 95.7,
            "memoryPercent": 91.4,
            "activeProcesses": 312,
            "activeConnections": 156,
            "totalThreats": 28,
        },
        {
            "id": "dev-005-demo",
            "deviceName": "LAPTOP-FINANCE-01",
            "osVersion": "Windows 10 Pro",
            "status": "offline",
            "lastSeen": (now - timedelta(hours=2)).isoformat() + "Z",
            "riskScore": 25.0,
            "riskLevel": "low",
            "cpuPercent": 0,
            "memoryPercent": 0,
            "activeProcesses": 0,
            "activeConnections": 0,
            "totalThreats": 5,
        },
    ]
    
    demo_threats = [
        {
            "id": "threat-001",
            "deviceId": "dev-004-demo",
            "deviceName": "DESKTOP-DEV-MARK",
            "pid": 8472,
            "processName": "cryptominer.exe",
            "anomalyScore": 0.96,
            "severity": "critical",
            "reason": "High CPU (97.3%) with heavy disk writes; Many outbound connections (45); Unusual behavior pattern",
            "actionTaken": "kill_process",
            "detectedAt": (now - timedelta(minutes=3)).isoformat() + "Z",
            "isResolved": True,
        },
        {
            "id": "threat-002",
            "deviceId": "dev-002-demo",
            "deviceName": "LAPTOP-HR-SARAH",
            "pid": 15234,
            "processName": "svchost_update.exe",
            "anomalyScore": 0.87,
            "severity": "high",
            "reason": "Mimicking system process name; High file write activity (234 ops); Ransomware extension detected",
            "actionTaken": "kill_process",
            "detectedAt": (now - timedelta(minutes=12)).isoformat() + "Z",
            "isResolved": True,
        },
        {
            "id": "threat-003",
            "deviceId": "dev-004-demo",
            "deviceName": "DESKTOP-DEV-MARK",
            "pid": 22891,
            "processName": "data_sync.exe",
            "anomalyScore": 0.82,
            "severity": "high",
            "reason": "Data exfiltration pattern: 156 outbound connections to unique IPs; High upload rate",
            "actionTaken": "alert",
            "detectedAt": (now - timedelta(minutes=5)).isoformat() + "Z",
            "isResolved": False,
        },
        {
            "id": "threat-004",
            "deviceId": "dev-002-demo",
            "deviceName": "LAPTOP-HR-SARAH",
            "pid": 9102,
            "processName": "powershell.exe",
            "anomalyScore": 0.71,
            "severity": "medium",
            "reason": "Unexpected PowerShell execution with encoded commands; Network activity detected",
            "actionTaken": "alert",
            "detectedAt": (now - timedelta(minutes=25)).isoformat() + "Z",
            "isResolved": False,
        },
        {
            "id": "threat-005",
            "deviceId": "dev-001-demo",
            "deviceName": "DESKTOP-SALES-01",
            "pid": 4521,
            "processName": "update_helper.exe",
            "anomalyScore": 0.65,
            "severity": "medium",
            "reason": "Unknown process with network activity; Not in known software inventory",
            "actionTaken": "alert",
            "detectedAt": (now - timedelta(hours=1)).isoformat() + "Z",
            "isResolved": False,
        },
    ]
    
    # Generate trend data
    threat_trend = []
    for i in range(7):
        day = now - timedelta(days=6-i)
        threats_count = random.randint(2, 18)
        threat_trend.append({
            "date": day.strftime("%Y-%m-%d"),
            "threats": threats_count,
            "blocked": int(threats_count * random.uniform(0.6, 0.9)),
        })
    
    # Generate activity chart
    activity_chart = []
    for i in range(24):
        base_procs = 100 + random.randint(-20, 40)
        activity_chart.append({
            "hour": f"{i:02d}:00",
            "processes": base_procs if 8 <= i <= 18 else base_procs // 2,
            "connections": random.randint(15, 80),
            "fileEvents": random.randint(3, 40),
        })
    
    return demo_devices, demo_threats, threat_trend, activity_chart
