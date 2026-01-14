"""
CyberShield AI - Pydantic Schemas
Request/Response models with validation
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator
import hashlib


# ============================================
# Enums and Types
# ============================================

InputType = Literal["email", "url", "message"]
SeverityLevel = Literal["critical", "high", "medium", "low", "safe"]
ThreatType = Literal[
    "phishing", "malware", "spam", "social_engineering",
    "credential_theft", "url_threat", "data_exfiltration", "safe", "unknown"
]


# ============================================
# Analysis Schemas
# ============================================

class AnalyzeRequest(BaseModel):
    """Request to analyze content for threats"""
    type: InputType = Field(..., description="Type of content to analyze")
    content: str = Field(..., min_length=1, max_length=50000, description="Content to analyze")
    
    @field_validator("content")
    @classmethod
    def sanitize_content(cls, v: str) -> str:
        """Basic sanitization of input content"""
        return v.strip()
    
    def get_content_hash(self) -> str:
        """Generate SHA-256 hash of content for privacy-preserving storage"""
        return hashlib.sha256(self.content.encode()).hexdigest()


class ThreatIndicator(BaseModel):
    """Individual threat indicator detected"""
    type: Literal["keyword", "url", "pattern", "behavioral"]
    value: str = Field(..., description="The detected indicator (may be masked)")
    risk_contribution: int = Field(..., ge=0, le=100, alias="riskContribution")
    description: str
    
    class Config:
        populate_by_name = True


class ExplanationSection(BaseModel):
    """Section of explainable AI output"""
    title: str
    content: str
    severity: SeverityLevel
    indicators: Optional[list[ThreatIndicator]] = None


class RiskContribution(BaseModel):
    """Risk contribution by category"""
    label: str
    value: int = Field(..., ge=0, le=100)
    category: str


class AnalyzeResponse(BaseModel):
    """Response from threat analysis"""
    id: str
    threat_type: ThreatType = Field(..., alias="threatType")
    severity: SeverityLevel
    risk_score: int = Field(..., ge=0, le=100, alias="riskScore")
    confidence: int = Field(..., ge=0, le=100)
    summary: str
    explanation: list[ExplanationSection]
    indicators: list[ThreatIndicator]
    recommendations: list[str]
    risk_contributions: list[RiskContribution] = Field(default=[], alias="riskContributions")
    analyzed_at: str = Field(..., alias="analyzedAt")
    input_hash: str = Field(..., alias="inputHash")
    processing_time_ms: Optional[int] = Field(None, alias="processingTimeMs")
    model_version: str = Field(default="1.0.0", alias="modelVersion")
    
    # False positive awareness
    false_positive_likelihood: Literal["low", "medium", "high"] = Field(
        default="low", alias="falsePositiveLikelihood"
    )
    
    class Config:
        populate_by_name = True


# ============================================
# Dashboard Schemas
# ============================================

class ThreatTrendPoint(BaseModel):
    """Single point in threat trend chart"""
    date: str
    count: int


class DashboardMetricsResponse(BaseModel):
    """Dashboard KPI metrics"""
    total_threats: int = Field(..., alias="totalThreats")
    high_risk_count: int = Field(..., alias="highRiskCount")
    threats_today: int = Field(..., alias="threatsToday")
    avg_risk_score: float = Field(..., alias="avgRiskScore")
    detection_rate: float = Field(..., alias="detectionRate")
    false_positive_rate: float = Field(..., alias="falsePositiveRate")
    
    class Config:
        populate_by_name = True


class DashboardTrendsResponse(BaseModel):
    """Dashboard chart data"""
    threats_over_time: list[ThreatTrendPoint] = Field(..., alias="threatsOverTime")
    threats_by_type: dict[str, int] = Field(..., alias="threatsByType")
    severity_distribution: dict[str, int] = Field(..., alias="severityDistribution")
    
    class Config:
        populate_by_name = True


class DashboardStatsResponse(BaseModel):
    """Combined dashboard stats (for existing API compatibility)"""
    total_threats: int = Field(..., alias="totalThreats")
    high_risk_count: int = Field(..., alias="highRiskCount")
    threats_by_type: dict[str, int] = Field(..., alias="threatsByType")
    threats_over_time: list[ThreatTrendPoint] = Field(..., alias="threatsOverTime")
    recent_alerts: list["HistoryEntry"] = Field(..., alias="recentAlerts")
    
    class Config:
        populate_by_name = True


# ============================================
# History Schemas
# ============================================

class HistoryEntry(BaseModel):
    """Single history entry"""
    id: str
    input_type: InputType = Field(..., alias="inputType")
    input_hash: str = Field(..., alias="inputHash")
    threat_type: ThreatType = Field(..., alias="threatType")
    severity: SeverityLevel
    risk_score: int = Field(..., alias="riskScore")
    analyzed_at: str = Field(..., alias="analyzedAt")
    analyzed_by: Optional[str] = Field(None, alias="analyzedBy")
    
    class Config:
        populate_by_name = True


class HistoryResponse(BaseModel):
    """Paginated history response"""
    items: list[HistoryEntry]
    total: int
    page: int
    page_size: int = Field(..., alias="pageSize")
    has_more: bool = Field(..., alias="hasMore")
    
    class Config:
        populate_by_name = True


class HistoryFilters(BaseModel):
    """History query filters"""
    severity: Optional[SeverityLevel] = None
    threat_type: Optional[ThreatType] = None
    input_type: Optional[InputType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# ============================================
# Feedback Schemas
# ============================================

class FeedbackRequest(BaseModel):
    """User feedback on analysis"""
    analysis_hash: str = Field(..., alias="analysisHash")
    feedback_type: Literal["false_positive", "false_negative", "accurate"] = Field(
        ..., alias="feedbackType"
    )
    comment: Optional[str] = Field(None, max_length=1000)
    
    class Config:
        populate_by_name = True


class FeedbackResponse(BaseModel):
    """Feedback submission response"""
    success: bool
    message: str
    feedback_id: str = Field(..., alias="feedbackId")
    
    class Config:
        populate_by_name = True


# ============================================
# Health & System Schemas
# ============================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: Literal["healthy", "degraded", "unhealthy"]
    version: str
    demo_mode: bool = Field(..., alias="demoMode")
    database: Literal["connected", "disconnected"]
    ai_model: Literal["loaded", "loading", "error"]
    timestamp: str
    
    class Config:
        populate_by_name = True


class SystemInfoResponse(BaseModel):
    """System information"""
    app_name: str = Field(..., alias="appName")
    version: str
    demo_mode: bool = Field(..., alias="demoMode")
    features: list[str]
    privacy_policy: dict = Field(..., alias="privacyPolicy")
    
    class Config:
        populate_by_name = True


# ============================================
# API Response Wrapper
# ============================================

class ApiResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool
    data: Optional[dict | list] = None
    error: Optional[dict] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


# Forward reference resolution
DashboardStatsResponse.model_rebuild()
