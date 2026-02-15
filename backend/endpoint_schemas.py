"""
CyberShield AI - Endpoint API Schemas
Pydantic models for endpoint agent communication
"""
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


# ============================================
# Agent → Backend Schemas
# ============================================

class DeviceRegistration(BaseModel):
    """Agent registration request"""
    device_id: str = Field(..., alias="device_id")
    device_name: str = Field(..., alias="device_name")
    os_version: str = Field("", alias="os_version")
    agent_version: str = Field("1.0.0", alias="agent_version")
    capabilities: List[str] = Field(default_factory=list)
    timestamp: str = ""
    
    class Config:
        populate_by_name = True


class ProcessBehaviorData(BaseModel):
    """Process behavior data from agent"""
    pid: int
    name: str
    avg_cpu: float = 0
    max_cpu: float = 0
    avg_memory_mb: float = 0
    max_memory_mb: float = 0
    total_io_writes: int = 0
    total_io_reads: int = 0
    io_write_rate: float = 0
    io_read_rate: float = 0
    file_write_count: int = 0
    file_rename_count: int = 0
    connection_count: int = 0
    outbound_connections: int = 0
    thread_count: int = 0
    execution_frequency: int = 1
    parent_pid: Optional[int] = None
    parent_name: Optional[str] = None
    exe_path: Optional[str] = None
    is_new_process: bool = False
    uptime_seconds: float = 0
    snapshot_count: int = 0
    timestamp: str = ""


class FileActivityData(BaseModel):
    """File activity summary from agent"""
    total_events: int = 0
    created_count: int = 0
    modified_count: int = 0
    deleted_count: int = 0
    moved_count: int = 0
    renamed_count: int = 0
    sensitive_files_touched: int = 0
    ransomware_ext_detected: int = 0
    unique_directories: int = 0
    events_per_minute: float = 0
    mass_file_ops: bool = False
    suspicious_renames: int = 0
    timestamp: str = ""


class NetworkActivityData(BaseModel):
    """Network activity summary from agent"""
    total_connections: int = 0
    outbound_connections: int = 0
    inbound_connections: int = 0
    listening_ports: int = 0
    unique_remote_ips: int = 0
    unique_remote_ports: int = 0
    suspicious_connections: int = 0
    suspicious_ports_used: List[int] = Field(default_factory=list)
    high_connection_processes: List[Dict] = Field(default_factory=list)
    new_connections_since_last: int = 0
    data_transfer_indicator: str = "normal"
    timestamp: str = ""


class SystemMetricsData(BaseModel):
    """System-level metrics from agent"""
    cpu_percent: float = 0
    cpu_count: int = 1
    memory_total_gb: float = 0
    memory_used_gb: float = 0
    memory_percent: float = 0
    disk_total_gb: float = 0
    disk_used_gb: float = 0
    disk_percent: float = 0
    net_bytes_sent: int = 0
    net_bytes_recv: int = 0
    net_connections: int = 0
    boot_time: str = ""
    timestamp: str = ""


class ResponseActionData(BaseModel):
    """Auto-response action from agent"""
    action_type: str
    target_pid: int = 0
    target_name: str = ""
    anomaly_score: float = 0
    reason: str = ""
    success: bool = True
    error_message: Optional[str] = None
    timestamp: str = ""


class BehaviorReport(BaseModel):
    """Single behavior report containing process data"""
    process_behaviors: List[Dict[str, Any]] = Field(default_factory=list)
    new_processes: List[Dict] = Field(default_factory=list)
    terminated_processes: List[Dict] = Field(default_factory=list)
    total_processes: int = 0
    timestamp: str = ""


class AgentScanReport(BaseModel):
    """Single scan report from agent"""
    device_id: str
    device_name: str = ""
    scan_number: int = 0
    behavior: BehaviorReport
    file_activity: FileActivityData
    network_activity: NetworkActivityData
    system_metrics: SystemMetricsData
    response_actions: List[ResponseActionData] = Field(default_factory=list)
    timestamp: str = ""


class AgentReportBatch(BaseModel):
    """Batch of reports from agent"""
    device_id: str
    reports: List[AgentScanReport]
    report_count: int = 0
    timestamp: str = ""


# ============================================
# Backend → Agent Schemas
# ============================================

class ThreatDetection(BaseModel):
    """Threat detection result sent to agent"""
    pid: int
    process_name: str
    anomaly_score: float
    severity: str
    reason: str
    action: str = "alert"  # alert, kill_process


class ReportResponse(BaseModel):
    """Response to agent report"""
    success: bool = True
    threats: List[ThreatDetection] = Field(default_factory=list)
    commands: List[Dict] = Field(default_factory=list)
    message: str = "Report received"


class CommandResponse(BaseModel):
    """Pending commands for agent"""
    commands: List[Dict] = Field(default_factory=list)


class CommandResult(BaseModel):
    """Agent's report of command execution"""
    device_id: str
    command_id: str
    action: Dict
    timestamp: str = ""


# ============================================
# Dashboard API Schemas
# ============================================

class DeviceOverview(BaseModel):
    """Device overview for dashboard"""
    id: str
    device_name: str = Field(..., alias="deviceName")
    os_version: str = Field("", alias="osVersion")
    status: str
    last_seen: str = Field(..., alias="lastSeen")
    risk_score: float = Field(0.0, alias="riskScore")
    risk_level: str = Field("safe", alias="riskLevel")
    cpu_percent: float = Field(0.0, alias="cpuPercent")
    memory_percent: float = Field(0.0, alias="memoryPercent")
    active_processes: int = Field(0, alias="activeProcesses")
    active_connections: int = Field(0, alias="activeConnections")
    total_threats: int = Field(0, alias="totalThreats")
    
    class Config:
        populate_by_name = True


class EndpointDashboardStats(BaseModel):
    """Endpoint monitoring dashboard statistics"""
    total_devices: int = Field(0, alias="totalDevices")
    online_devices: int = Field(0, alias="onlineDevices")
    at_risk_devices: int = Field(0, alias="atRiskDevices")
    total_threats_today: int = Field(0, alias="totalThreatsToday")
    total_threats_all: int = Field(0, alias="totalThreatsAll")
    active_threats: int = Field(0, alias="activeThreats")
    avg_risk_score: float = Field(0.0, alias="avgRiskScore")
    processes_killed: int = Field(0, alias="processesKilled")
    model_status: str = Field("heuristic", alias="modelStatus")
    training_samples: int = Field(0, alias="trainingSamples")
    devices: List[DeviceOverview] = Field(default_factory=list)
    recent_threats: List[Dict] = Field(default_factory=list, alias="recentThreats")
    threat_trend: List[Dict] = Field(default_factory=list, alias="threatTrend")
    activity_chart: List[Dict] = Field(default_factory=list, alias="activityChart")
    
    class Config:
        populate_by_name = True


class ThreatAlertResponse(BaseModel):
    """Individual threat alert for dashboard"""
    id: str
    device_id: str = Field(..., alias="deviceId")
    device_name: str = Field("", alias="deviceName")
    pid: int
    process_name: str = Field("", alias="processName")
    anomaly_score: float = Field(0.0, alias="anomalyScore")
    severity: str
    reason: str
    action_taken: str = Field("alert", alias="actionTaken")
    detected_at: str = Field("", alias="detectedAt")
    is_resolved: bool = Field(False, alias="isResolved")
    
    class Config:
        populate_by_name = True


class KillProcessRequest(BaseModel):
    """Request to kill a process on a device"""
    device_id: str = Field(..., alias="deviceId")
    pid: int
    process_name: str = Field(..., alias="processName")
    reason: str = "Manual kill from dashboard"
