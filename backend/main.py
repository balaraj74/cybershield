"""
CyberShield AI - FastAPI Backend
Production-ready API for AI threat detection platform
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional
from contextlib import asynccontextmanager
import random

from fastapi import FastAPI, HTTPException, Depends, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from config import get_settings, Settings
from models import (
    ThreatAnalysis, DashboardMetrics, UserFeedback, AuditLog,
    get_engine, get_session_maker, init_db, Base
)
from schemas import (
    AnalyzeRequest, AnalyzeResponse, ApiResponse,
    DashboardStatsResponse, DashboardMetricsResponse, DashboardTrendsResponse,
    HistoryResponse, HistoryEntry, HistoryFilters,
    FeedbackRequest, FeedbackResponse,
    HealthResponse, ThreatTrendPoint
)
from analyzer import get_analyzer, ThreatAnalyzer


# ============================================
# Application Setup
# ============================================

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

# Database instances (initialized on startup)
engine = None
SessionLocal = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global engine, SessionLocal
    
    # Startup
    print("🚀 Starting CyberShield AI Backend...")
    engine = await get_engine(settings.database_url)
    SessionLocal = await get_session_maker(engine)
    await init_db(engine)
    
    # Seed demo data if demo mode
    if settings.demo_mode:
        await seed_demo_data()
    
    print(f"✅ CyberShield AI Backend running (Demo Mode: {settings.demo_mode})")
    
    yield
    
    # Shutdown
    print("👋 Shutting down CyberShield AI Backend...")
    if engine:
        await engine.dispose()


app = FastAPI(
    title="CyberShield AI API",
    description="AI-powered threat detection and analysis platform",
    version="1.0.0",
    lifespan=lifespan
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Dependencies
# ============================================

async def get_db() -> AsyncSession:
    """Get database session"""
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def verify_api_key(request: Request):
    """Verify API key for protected endpoints"""
    api_key = request.headers.get("X-API-Key")
    if settings.api_key and api_key != settings.api_key:
        # For demo mode, allow without key
        if not settings.demo_mode:
            raise HTTPException(status_code=401, detail="Invalid API key")


# ============================================
# Demo Data Seeding
# ============================================

async def seed_demo_data():
    """Seed database with demo data for hackathon"""
    async with SessionLocal() as session:
        # Check if data exists
        result = await session.execute(select(func.count(ThreatAnalysis.id)))
        count = result.scalar()
        
        if count > 0:
            print(f"📊 Database already has {count} records")
            return
        
        print("🌱 Seeding demo data...")
        
        # Generate realistic demo analyses
        threat_types = ["phishing", "malware", "spam", "social_engineering", "url_threat", "safe"]
        severities = ["critical", "high", "medium", "low", "safe"]
        input_types = ["email", "url", "message"]
        
        now = datetime.utcnow()
        
        for i in range(50):
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            
            threat = random.choices(threat_types, weights=[25, 10, 20, 15, 15, 15])[0]
            if threat == "safe":
                severity = "safe"
                risk_score = random.randint(0, 15)
            elif threat in ["phishing", "malware"]:
                severity = random.choices(["critical", "high"], weights=[40, 60])[0]
                risk_score = random.randint(65, 98)
            else:
                severity = random.choices(["medium", "low"], weights=[60, 40])[0]
                risk_score = random.randint(25, 65)
            
            analysis = ThreatAnalysis(
                id=str(uuid.uuid4()),
                input_hash=f"demo{i:04d}" + uuid.uuid4().hex[:8],
                input_type=random.choice(input_types),
                threat_type=threat,
                severity=severity,
                risk_score=risk_score,
                confidence=random.uniform(0.65, 0.98),
                summary=f"Demo analysis #{i+1}",
                analyzed_at=now - timedelta(days=days_ago, hours=hours_ago),
                model_version="1.0.0"
            )
            session.add(analysis)
        
        await session.commit()
        print("✅ Demo data seeded (50 analyses)")


# ============================================
# Health & Status Endpoints
# ============================================

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        demoMode=settings.demo_mode,
        database="connected",
        aiModel="loaded",
        timestamp=datetime.utcnow().isoformat() + "Z"
    )


@app.get("/", tags=["System"])
async def root():
    """API root"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "demo_mode": settings.demo_mode,
        "docs": "/docs"
    }


# ============================================
# Analysis Endpoints
# ============================================

@app.post("/analyze", response_model=ApiResponse, tags=["Analysis"])
@limiter.limit("10/minute")
async def analyze_content(
    request: Request,
    body: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    analyzer: ThreatAnalyzer = Depends(get_analyzer)
):
    """
    Analyze content for threats.
    Privacy-first: Raw content is processed in-memory and never stored.
    """
    try:
        # Run analysis
        result = await analyzer.analyze(body)
        
        # Store anonymized result (no raw content)
        analysis_record = ThreatAnalysis(
            id=result.id,
            input_hash=body.get_content_hash(),
            input_type=body.type,
            threat_type=result.threat_type,
            severity=result.severity,
            risk_score=result.risk_score,
            confidence=result.confidence / 100,  # Store as 0-1
            summary=result.summary,
            explanation=[e.model_dump() for e in result.explanation],
            indicators=[i.model_dump() for i in result.indicators],
            recommendations=result.recommendations,
            risk_contributions=[r.model_dump() for r in result.risk_contributions],
            analyzed_at=datetime.utcnow(),
            processing_time_ms=result.processing_time_ms,
            model_version=result.model_version
        )
        
        db.add(analysis_record)
        await db.commit()
        
        # Log audit
        audit = AuditLog(
            id=str(uuid.uuid4()),
            action="analyze",
            resource=f"analysis:{result.id}",
            details={"input_type": body.type, "threat_type": result.threat_type}
        )
        db.add(audit)
        await db.commit()
        
        return ApiResponse(
            success=True,
            data=result.model_dump(by_alias=True)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Dashboard Endpoints
# ============================================

@app.get("/dashboard/metrics", response_model=ApiResponse, tags=["Dashboard"])
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard KPI metrics"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total threats
    total_result = await db.execute(
        select(func.count(ThreatAnalysis.id))
        .where(ThreatAnalysis.severity != "safe")
    )
    total_threats = total_result.scalar() or 0
    
    # High risk count
    high_result = await db.execute(
        select(func.count(ThreatAnalysis.id))
        .where(ThreatAnalysis.severity.in_(["critical", "high"]))
    )
    high_risk_count = high_result.scalar() or 0
    
    # Today's threats
    today_result = await db.execute(
        select(func.count(ThreatAnalysis.id))
        .where(ThreatAnalysis.analyzed_at >= today_start)
        .where(ThreatAnalysis.severity != "safe")
    )
    threats_today = today_result.scalar() or 0
    
    # Average risk score
    avg_result = await db.execute(
        select(func.avg(ThreatAnalysis.risk_score))
        .where(ThreatAnalysis.severity != "safe")
    )
    avg_risk_score = avg_result.scalar() or 0
    
    # Detection rate (threats / total analyses)
    total_analyses = await db.execute(select(func.count(ThreatAnalysis.id)))
    total = total_analyses.scalar() or 1
    detection_rate = (total_threats / total) * 100
    
    # False positive rate
    fp_result = await db.execute(
        select(func.count(ThreatAnalysis.id))
        .where(ThreatAnalysis.is_false_positive == True)
    )
    fp_count = fp_result.scalar() or 0
    fp_rate = (fp_count / max(total_threats, 1)) * 100
    
    return ApiResponse(
        success=True,
        data={
            "totalThreats": total_threats,
            "highRiskCount": high_risk_count,
            "threatsToday": threats_today,
            "avgRiskScore": round(avg_risk_score, 1),
            "detectionRate": round(detection_rate, 1),
            "falsePositiveRate": round(fp_rate, 1)
        }
    )


@app.get("/dashboard/trends", response_model=ApiResponse, tags=["Dashboard"])
async def get_dashboard_trends(
    days: int = Query(default=7, ge=1, le=30),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard chart data"""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    
    # Threats over time
    threats_over_time = []
    for i in range(days):
        day = start_date + timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        count_result = await db.execute(
            select(func.count(ThreatAnalysis.id))
            .where(ThreatAnalysis.analyzed_at >= day_start)
            .where(ThreatAnalysis.analyzed_at < day_end)
            .where(ThreatAnalysis.severity != "safe")
        )
        count = count_result.scalar() or 0
        threats_over_time.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": count
        })
    
    # Threats by type
    type_result = await db.execute(
        select(ThreatAnalysis.threat_type, func.count(ThreatAnalysis.id))
        .where(ThreatAnalysis.analyzed_at >= start_date)
        .group_by(ThreatAnalysis.threat_type)
    )
    threats_by_type = {row[0]: row[1] for row in type_result.fetchall()}
    
    # Severity distribution
    sev_result = await db.execute(
        select(ThreatAnalysis.severity, func.count(ThreatAnalysis.id))
        .where(ThreatAnalysis.analyzed_at >= start_date)
        .group_by(ThreatAnalysis.severity)
    )
    severity_distribution = {row[0]: row[1] for row in sev_result.fetchall()}
    
    return ApiResponse(
        success=True,
        data={
            "threatsOverTime": threats_over_time,
            "threatsByType": threats_by_type,
            "severityDistribution": severity_distribution
        }
    )


@app.get("/dashboard/stats", response_model=ApiResponse, tags=["Dashboard"])
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db)
):
    """Get combined dashboard stats (for legacy compatibility)"""
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    
    # Total threats
    total_result = await db.execute(
        select(func.count(ThreatAnalysis.id))
        .where(ThreatAnalysis.severity != "safe")
    )
    total_threats = total_result.scalar() or 0
    
    # High risk count
    high_result = await db.execute(
        select(func.count(ThreatAnalysis.id))
        .where(ThreatAnalysis.severity.in_(["critical", "high"]))
    )
    high_risk_count = high_result.scalar() or 0
    
    # Threats over time (7 days)
    threats_over_time = []
    for i in range(7):
        day = week_ago + timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        count_result = await db.execute(
            select(func.count(ThreatAnalysis.id))
            .where(ThreatAnalysis.analyzed_at >= day_start)
            .where(ThreatAnalysis.analyzed_at < day_end)
        )
        count = count_result.scalar() or 0
        threats_over_time.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": count
        })
    
    # Threats by type
    type_result = await db.execute(
        select(ThreatAnalysis.threat_type, func.count(ThreatAnalysis.id))
        .group_by(ThreatAnalysis.threat_type)
    )
    threats_by_type = {row[0]: row[1] for row in type_result.fetchall()}
    
    # Recent alerts
    recent_result = await db.execute(
        select(ThreatAnalysis)
        .where(ThreatAnalysis.severity != "safe")
        .order_by(desc(ThreatAnalysis.analyzed_at))
        .limit(5)
    )
    recent_rows = recent_result.scalars().all()
    
    recent_alerts = [
        {
            "id": r.id,
            "inputType": r.input_type,
            "inputHash": r.input_hash[:16],
            "threatType": r.threat_type,
            "severity": r.severity,
            "riskScore": r.risk_score,
            "analyzedAt": r.analyzed_at.isoformat() + "Z",
            "analyzedBy": r.analyzed_by
        }
        for r in recent_rows
    ]
    
    return ApiResponse(
        success=True,
        data={
            "totalThreats": total_threats,
            "highRiskCount": high_risk_count,
            "threatsByType": threats_by_type,
            "threatsOverTime": threats_over_time,
            "recentAlerts": recent_alerts
        }
    )


# ============================================
# History Endpoints
# ============================================

@app.get("/history", response_model=ApiResponse, tags=["History"])
async def get_analysis_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    severity: Optional[str] = None,
    threat_type: Optional[str] = None,
    input_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get paginated analysis history"""
    query = select(ThreatAnalysis).order_by(desc(ThreatAnalysis.analyzed_at))
    count_query = select(func.count(ThreatAnalysis.id))
    
    # Apply filters
    if severity:
        query = query.where(ThreatAnalysis.severity == severity)
        count_query = count_query.where(ThreatAnalysis.severity == severity)
    if threat_type:
        query = query.where(ThreatAnalysis.threat_type == threat_type)
        count_query = count_query.where(ThreatAnalysis.threat_type == threat_type)
    if input_type:
        query = query.where(ThreatAnalysis.input_type == input_type)
        count_query = count_query.where(ThreatAnalysis.input_type == input_type)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    rows = result.scalars().all()
    
    items = [
        {
            "id": r.id,
            "inputType": r.input_type,
            "inputHash": r.input_hash[:16],
            "threatType": r.threat_type,
            "severity": r.severity,
            "riskScore": r.risk_score,
            "analyzedAt": r.analyzed_at.isoformat() + "Z",
            "analyzedBy": r.analyzed_by
        }
        for r in rows
    ]
    
    return ApiResponse(
        success=True,
        data={
            "items": items,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "hasMore": (page * page_size) < total
        }
    )


@app.get("/history/{analysis_id}", response_model=ApiResponse, tags=["History"])
async def get_analysis_detail(
    analysis_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed analysis result by ID"""
    result = await db.execute(
        select(ThreatAnalysis).where(ThreatAnalysis.id == analysis_id)
    )
    analysis = result.scalar_one_or_none()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return ApiResponse(
        success=True,
        data={
            "id": analysis.id,
            "inputType": analysis.input_type,
            "inputHash": analysis.input_hash[:16],
            "threatType": analysis.threat_type,
            "severity": analysis.severity,
            "riskScore": analysis.risk_score,
            "confidence": int(analysis.confidence * 100),
            "summary": analysis.summary,
            "explanation": analysis.explanation,
            "indicators": analysis.indicators,
            "recommendations": analysis.recommendations,
            "riskContributions": analysis.risk_contributions,
            "analyzedAt": analysis.analyzed_at.isoformat() + "Z",
            "processingTimeMs": analysis.processing_time_ms,
            "modelVersion": analysis.model_version,
            "isFalsePositive": analysis.is_false_positive
        }
    )


# ============================================
# Feedback Endpoints
# ============================================

@app.post("/feedback", response_model=ApiResponse, tags=["Feedback"])
@limiter.limit("5/minute")
async def submit_feedback(
    request: Request,
    body: FeedbackRequest,
    db: AsyncSession = Depends(get_db)
):
    """Submit feedback on analysis (false positive reporting)"""
    feedback_id = str(uuid.uuid4())
    
    # Create feedback record
    feedback = UserFeedback(
        id=feedback_id,
        analysis_hash=body.analysis_hash,
        feedback_type=body.feedback_type,
        user_comment=body.comment
    )
    db.add(feedback)
    
    # Update analysis if marking as false positive
    if body.feedback_type == "false_positive":
        result = await db.execute(
            select(ThreatAnalysis)
            .where(ThreatAnalysis.input_hash.startswith(body.analysis_hash))
        )
        analysis = result.scalar_one_or_none()
        if analysis:
            analysis.is_false_positive = True
            analysis.feedback_at = datetime.utcnow()
    
    await db.commit()
    
    return ApiResponse(
        success=True,
        data={
            "success": True,
            "message": "Thank you for your feedback! This helps improve our AI.",
            "feedbackId": feedback_id
        }
    )


# ============================================
# Error Handlers
# ============================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            success=False,
            error={"code": str(exc.status_code), "message": exc.detail},
            timestamp=datetime.utcnow().isoformat() + "Z"
        ).model_dump()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=ApiResponse(
            success=False,
            error={"code": "500", "message": "Internal server error"},
            timestamp=datetime.utcnow().isoformat() + "Z"
        ).model_dump()
    )


# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
