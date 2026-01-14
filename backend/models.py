"""
CyberShield AI - Database Models
SQLAlchemy models for threat analysis storage (anonymized data only)
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


class ThreatAnalysis(Base):
    """
    Stores anonymized threat analysis results.
    NO raw input content is stored - only hashed references and metadata.
    Privacy-by-design: Only stores what's needed for analytics.
    """
    __tablename__ = "threat_analyses"
    
    id = Column(String(36), primary_key=True, index=True)
    input_hash = Column(String(64), unique=True, index=True)  # SHA-256 hash of input
    input_type = Column(String(20), nullable=False)  # email, url, message
    
    # Analysis Results (no sensitive data)
    threat_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)  # critical, high, medium, low, safe
    risk_score = Column(Integer, nullable=False)  # 0-100
    confidence = Column(Float, nullable=False)  # 0.0-1.0
    
    # Explainable AI data (anonymized)
    summary = Column(Text, nullable=True)
    explanation = Column(JSON, nullable=True)  # Structured explanation sections
    indicators = Column(JSON, nullable=True)  # Detected threat indicators
    recommendations = Column(JSON, nullable=True)  # Action recommendations
    
    # Risk contribution breakdown
    risk_contributions = Column(JSON, nullable=True)
    
    # Metadata
    analyzed_at = Column(DateTime, default=datetime.utcnow, index=True)
    analyzed_by = Column(String(100), nullable=True)  # User ID (hashed)
    processing_time_ms = Column(Integer, nullable=True)
    model_version = Column(String(20), default="1.0.0")
    
    # Feedback
    is_false_positive = Column(Boolean, default=False)
    feedback_at = Column(DateTime, nullable=True)


class DashboardMetrics(Base):
    """
    Pre-aggregated metrics for fast dashboard loading.
    Updated periodically to avoid expensive queries.
    """
    __tablename__ = "dashboard_metrics"
    
    id = Column(String(36), primary_key=True)
    metric_date = Column(DateTime, index=True)
    
    # Counts
    total_analyses = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    safe_count = Column(Integer, default=0)
    
    # By type
    email_count = Column(Integer, default=0)
    url_count = Column(Integer, default=0)
    message_count = Column(Integer, default=0)
    
    # Threat types (JSON for flexibility)
    threat_type_counts = Column(JSON, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow)


class UserFeedback(Base):
    """
    User feedback for improving AI accuracy.
    Privacy-preserving: references analysis by hash only.
    """
    __tablename__ = "user_feedback"
    
    id = Column(String(36), primary_key=True)
    analysis_hash = Column(String(64), index=True)  # Reference to analysis
    
    feedback_type = Column(String(20), nullable=False)  # false_positive, false_negative, accurate
    user_comment = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String(100), nullable=True)  # Hashed user ID


class AuditLog(Base):
    """
    Security audit log for compliance and monitoring.
    """
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True)
    action = Column(String(50), nullable=False)
    resource = Column(String(100), nullable=True)
    
    user_id = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(String(500), nullable=True)
    
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


# Database connection setup
async def get_engine(database_url: str):
    """Create async database engine"""
    return create_async_engine(
        database_url,
        echo=False,  # Set True for SQL debugging
        future=True
    )


async def get_session_maker(engine):
    """Create async session maker"""
    return sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )


async def init_db(engine):
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
