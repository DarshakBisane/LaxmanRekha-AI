from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import datetime

class DocumentResponse(BaseModel):
    id: str
    case_id: str
    document_type: str
    original_filename: str
    mime_type: str
    file_size: int
    sha256_hash: str
    processing_status: str
    ocr_confidence: Optional[float] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ExtractedFieldResponse(BaseModel):
    id: str
    document_id: Optional[str] = None
    field_name: str
    field_value: str
    normalized_value: str
    confidence: float
    source: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class CaseCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    ai_recommendation: str = Field(default="APPROVE LOAN", description="e.g. APPROVE LOAN, REJECT LOAN, APPROVE TRANSACTION")
    case_type: str = Field(default="LOAN_APPLICATION", description="LOAN_APPLICATION, TRANSACTION_VERIFICATION, KYC_ONBOARDING")
    transaction_amount: Optional[float] = None
    transaction_currency: str = "INR"
    transaction_type: Optional[str] = "LOAN_DISBURSEMENT"
    transaction_count_24h: int = 1
    is_new_device: bool = False
    is_unusual_location: bool = False

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ai_recommendation: Optional[str] = None
    transaction_amount: Optional[float] = None
    is_new_device: Optional[bool] = None
    is_unusual_location: Optional[bool] = None

class CaseResponse(BaseModel):
    id: str
    case_number: str
    created_by: str
    title: str
    description: Optional[str] = None
    ai_recommendation: str
    case_type: str
    status: str
    trust_score: Optional[float] = None
    risk_level: Optional[str] = None
    transaction_amount: Optional[float] = None
    transaction_currency: str
    transaction_type: Optional[str] = None
    transaction_count_24h: int
    is_new_device: bool
    is_unusual_location: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class VerificationItem(BaseModel):
    check_type: str
    status: str
    score: float
    details: Optional[Any] = None

class TrustScoreDetail(BaseModel):
    identity_score: float
    document_integrity_score: float
    field_consistency_score: float
    ocr_confidence_score: float
    source_verification_score: float
    transaction_risk_score: float
    final_score: float
    risk_level: str
    explanation: Optional[str] = None
    ai_recommendation_supported: bool

class SideBySideDiff(BaseModel):
    field_name: str
    uploaded_value: str
    trusted_value: Optional[str] = None
    status: str # MATCH, MISMATCH, NOT_FOUND, WARNING

class CrossDocConflict(BaseModel):
    field_name: str
    document_a: str
    value_a: str
    document_b: str
    value_b: str
    status: str

class PolicySnippet(BaseModel):
    filename: str
    section: str
    guidance: str
    relevance_score: Optional[float] = None

class CaseDetailResponse(CaseResponse):
    documents: List[DocumentResponse] = []
    extracted_fields: List[ExtractedFieldResponse] = []
    verification_results: List[VerificationItem] = []
    trust_score_detail: Optional[TrustScoreDetail] = None
    side_by_side_diff: List[SideBySideDiff] = []
    cross_doc_conflicts: List[CrossDocConflict] = []
    policy_guidance: List[PolicySnippet] = []
    ai_explanation: Optional[str] = None
    recommendation_verdict: Optional[str] = None # SUPPORTED, NOT_SUPPORTED, INSUFFICIENT_EVIDENCE
    final_action_routing: Optional[str] = None # PROCEED, ADDITIONAL_VERIFICATION, HUMAN_REVIEW_REQUIRED
