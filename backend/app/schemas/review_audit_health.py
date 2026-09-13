from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import datetime

# --- Reviews ---
class ReviewCreate(BaseModel):
    action: str = Field(..., description="APPROVE, REJECT, REQUEST_VERIFICATION")
    comment: Optional[str] = Field(None, description="Mandatory for REJECT and REQUEST_VERIFICATION")

class ReviewResponse(BaseModel):
    id: str
    case_id: str
    reviewer_id: str
    reviewer_name: Optional[str] = None
    action: str
    comment: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Audit Logs ---
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    case_id: Optional[str] = None
    case_number: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    metadata_json: Optional[Any] = None
    ip_hash_or_masked_ip: str
    prev_hash: Optional[str] = None
    current_hash: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Analytics ---
class RiskCount(BaseModel):
    low_risk: int = 0
    medium_risk: int = 0
    high_risk: int = 0

class DashboardSummary(BaseModel):
    total_cases: int = 0
    low_risk_cases: int = 0
    medium_risk_cases: int = 0
    high_risk_cases: int = 0
    pending_reviews: int = 0
    approved_cases: int = 0
    rejected_cases: int = 0
    avg_trust_score: float = 0.0
    risk_distribution: List[Dict[str, Any]] = []
    daily_case_activity: List[Dict[str, Any]] = []
    review_outcomes: List[Dict[str, Any]] = []
    high_risk_reasons: List[Dict[str, Any]] = []

# --- Health ---
class ComponentHealth(BaseModel):
    status: str # healthy, degraded, unavailable
    latency_ms: Optional[float] = None
    details: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    app_version: str
    environment: str
    timestamp: datetime.datetime
    components: Dict[str, ComponentHealth]
