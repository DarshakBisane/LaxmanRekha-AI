import time
import datetime
import pytesseract
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings
from app.services.redis_service import redis_service
from app.services.rag_service import rag_service
from app.schemas.review_audit_health import HealthResponse, ComponentHealth

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", response_model=HealthResponse, summary="Comprehensive system health check")
def health_check(db: Session = Depends(get_db)):
    components = {}

    # 1. Neon PostgreSQL Database Check
    db_start = time.time()
    try:
        db.execute(text("SELECT 1"))
        db_latency = round((time.time() - db_start) * 1000, 2)
        components["database"] = ComponentHealth(status="healthy", latency_ms=db_latency, details="Neon PostgreSQL 18 Serverless")
    except Exception as e:
        components["database"] = ComponentHealth(status="unavailable", details=str(e)[:100])

    # 2. Upstash Redis Check
    redis_start = time.time()
    try:
        if redis_service.client:
            redis_service.client.set("health_check_ping", "ok", ex=10)
            redis_latency = round((time.time() - redis_start) * 1000, 2)
            components["redis"] = ComponentHealth(status="healthy", latency_ms=redis_latency, details="Upstash Redis REST Client Connected")
        else:
            components["redis"] = ComponentHealth(status="degraded", details="Operating on in-memory fallback rate limiter")
    except Exception as e:
        components["redis"] = ComponentHealth(status="degraded", details=f"Redis warning: {str(e)[:80]}")

    # 3. Gemini API Check
    if settings.GEMINI_API_KEY:
        components["gemini"] = ComponentHealth(status="healthy", details=f"Google Gemini AI ({settings.GEMINI_MODEL}) configured")
    else:
        components["gemini"] = ComponentHealth(status="degraded", details="Gemini API key not configured - using deterministic fallback")

    # 4. Policy RAG Knowledge Base Check
    chunk_count = len(rag_service.chunks)
    if chunk_count > 0:
        components["rag"] = ComponentHealth(status="healthy", details=f"{chunk_count} policy chunks loaded and indexed")
    else:
        components["rag"] = ComponentHealth(status="degraded", details="Knowledge base index empty")

    # 5. Tesseract OCR Check
    try:
        ver = pytesseract.get_tesseract_version()
        components["tesseract_ocr"] = ComponentHealth(status="healthy", details=f"Tesseract OCR v{ver} available")
    except Exception:
        components["tesseract_ocr"] = ComponentHealth(status="degraded", details="Tesseract system binary not in PATH; fallback image rasterizer active")

    overall_status = "healthy" if components["database"].status == "healthy" else "degraded"

    return HealthResponse(
        status=overall_status,
        app_version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.datetime.now(datetime.timezone.utc),
        components=components
    )
