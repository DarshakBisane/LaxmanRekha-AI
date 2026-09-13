import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging import logger
from app.db.session import engine
from app.seed import seed_database
from app.api.v1 import auth, cases, reviews, audit, analytics, users, registry, policy, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is synced and seeded on startup
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;"))
            conn.commit()
    except Exception as e:
        logger.warning(f"Database table sync warning: {e}")

    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Startup seeding warning: {e}")

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "LaxmanRekha AI — AI Trust & Verification Layer for AI-Assisted Banking Decisions.\n"
        "“Don’t replace banking AI. Make banking AI trustworthy.”"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware with explicit origins and credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "Content-Disposition"]
)

# Request ID & Logging Middleware
@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = req_id
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({process_time:.1f}ms) [req:{req_id[:8]}]")
    return response

# Exception handlers
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    req_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "request_id": req_id,
                "details": exc.details
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The request payload failed input schema validation.",
                "request_id": req_id,
                "details": exc.errors()
            }
        }
    )

@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled server exception [req:{req_id}]: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred during processing. Please try again later.",
                "request_id": req_id
            }
        }
    )

# Include v1 API Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(cases.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(registry.router, prefix="/api/v1")
app.include_router(policy.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")

# Route aliases for top-level convenience
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")

@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "tagline": "Don’t replace banking AI. Make banking AI trustworthy."
    }
