"""
CyberShield AI - Endpoint Models
Database models for endpoint agent data
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, JSON
from models import Base


class EndpointDevice(Base):
    """Registered endpoint device"""
    __tablename__ = "endpoint_devices"
    
    id = Column(String(36), primary_key=True)  # device_id from agent
    device_name = Column(String(200), nullable=False)
    os_version = Column(String(100))
    agent_version = Column(String(20), default="1.0.0")
    
    # Status
    status = Column(String(20), default="online")  # online, offline, at_risk, compromised
    last_seen = Column(DateTime, default=datetime.utcnow)
    first_seen = Column(DateTime, default=datetime.utcnow)
    
    # Risk
    risk_score = Column(Float, default=0.0)  # 0-100
    risk_level = Column(String(20), default="safe")  # safe, low, medium, high, critical
    total_threats_detected = Column(Integer, default=0)
    
    # Capabilities
    capabilities = Column(JSON, default=list)
    
    # System metrics (latest)
    cpu_percent = Column(Float, default=0.0)
    memory_percent = Column(Float, default=0.0)
    disk_percent = Column(Float, default=0.0)
    active_processes = Column(Integer, default=0)
    active_connections = Column(Integer, default=0)


class EndpointThreat(Base):
    """Detected threat on an endpoint"""
    __tablename__ = "endpoint_threats"
    
    id = Column(String(36), primary_key=True)
    device_id = Column(String(36), index=True)
    
    # Process info
    pid = Column(Integer)
    process_name = Column(String(200))
    exe_path = Column(Text, nullable=True)
    
    # Detection
    anomaly_score = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False)  # critical, high, medium, low
    reason = Column(Text)
    detection_method = Column(String(50), default="ai_model")  # ai_model, heuristic
    
    # Features at time of detection
    features = Column(JSON, nullable=True)
    
    # Response
    action_taken = Column(String(50), default="alert")  # alert, kill_process, isolate
    action_success = Column(Boolean, default=True)
    
    # Timestamps
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)
    is_resolved = Column(Boolean, default=False)
    
    # False positive tracking
    is_false_positive = Column(Boolean, default=False)
    feedback_note = Column(Text, nullable=True)


class EndpointActivity(Base):
    """Aggregated endpoint activity log"""
    __tablename__ = "endpoint_activity"
    
    id = Column(String(36), primary_key=True)
    device_id = Column(String(36), index=True)
    
    # Process metrics
    total_processes = Column(Integer, default=0)
    new_processes = Column(Integer, default=0)
    terminated_processes = Column(Integer, default=0)
    
    # File activity
    file_events = Column(Integer, default=0)
    file_creates = Column(Integer, default=0)
    file_deletes = Column(Integer, default=0)
    file_renames = Column(Integer, default=0)
    sensitive_files_touched = Column(Integer, default=0)
    ransomware_indicators = Column(Integer, default=0)
    
    # Network activity
    total_connections = Column(Integer, default=0)
    outbound_connections = Column(Integer, default=0)
    suspicious_connections = Column(Integer, default=0)
    unique_remote_ips = Column(Integer, default=0)
    
    # System metrics
    cpu_percent = Column(Float, default=0.0)
    memory_percent = Column(Float, default=0.0)
    
    # Timestamp
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)


class PendingCommand(Base):
    """Commands queued for endpoint agents"""
    __tablename__ = "pending_commands"
    
    id = Column(String(36), primary_key=True)
    device_id = Column(String(36), index=True)
    
    action = Column(String(50), nullable=False)  # kill_process, isolate, scan
    pid = Column(Integer, nullable=True)
    process_name = Column(String(200), nullable=True)
    reason = Column(Text, nullable=True)
    
    # Status
    status = Column(String(20), default="pending")  # pending, sent, executed, failed
    result = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    executed_at = Column(DateTime, nullable=True)
    created_by = Column(String(100), nullable=True)  # dashboard user
