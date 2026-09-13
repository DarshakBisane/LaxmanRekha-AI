import uuid
import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    role = Column(String, default="bank_officer", nullable=False) # bank_officer, reviewer, admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    cases = relationship("Case", back_populates="creator", foreign_keys="Case.created_by")
    reviews = relationship("Review", back_populates="reviewer")
    audit_logs = relationship("AuditLog", back_populates="user")

class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_number = Column(String, unique=True, index=True, nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    ai_recommendation = Column(String, default="APPROVE LOAN", nullable=False)
    case_type = Column(String, default="LOAN_APPLICATION", nullable=False) # LOAN_APPLICATION, TRANSACTION_VERIFICATION, KYC_ONBOARDING
    status = Column(String, default="DRAFT", nullable=False) # DRAFT, PROCESSING, ANALYZED, PENDING_REVIEW, NEEDS_VERIFICATION, APPROVED, REJECTED, FAILED
    trust_score = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True) # LOW_RISK, MEDIUM_RISK, HIGH_RISK
    transaction_amount = Column(Float, nullable=True)
    transaction_currency = Column(String, default="INR", nullable=False)
    transaction_type = Column(String, nullable=True) # TRANSFER, LOAN_DISBURSEMENT, WITHDRAWAL, CREDIT_CARD
    transaction_count_24h = Column(Integer, default=1, nullable=False)
    is_new_device = Column(Boolean, default=False, nullable=False)
    is_unusual_location = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("User", back_populates="cases", foreign_keys=[created_by])
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    extracted_fields = relationship("ExtractedField", back_populates="case", cascade="all, delete-orphan")
    verification_results = relationship("VerificationResult", back_populates="case", cascade="all, delete-orphan")
    trust_scores = relationship("TrustScore", back_populates="case", uselist=False, cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    document_type = Column(String, nullable=False) # IDENTITY, SALARY_SLIP, BANK_STATEMENT, OTHER
    original_filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    sha256_hash = Column(String, nullable=False, index=True)
    processing_status = Column(String, default="PENDING", nullable=False) # PENDING, EXTRACTED, FAILED
    ocr_confidence = Column(Float, nullable=True)
    extracted_text_preview = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    case = relationship("Case", back_populates="documents")
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    field_name = Column(String, nullable=False) # full_name, date_of_birth, synthetic_id, employer, salary_amount, account_number
    field_value = Column(String, nullable=False)
    normalized_value = Column(String, nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)
    source = Column(String, default="DETERMINISTIC", nullable=False) # OCR_REGEX, GEMINI_STRUCTURED, RULE_HEURISTIC
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="extracted_fields")
    document = relationship("Document", back_populates="extracted_fields")

class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    check_type = Column(String, nullable=False) # IDENTITY, SOURCE, CROSS_DOCUMENT, DOCUMENT_INTEGRITY, OCR, TRANSACTION, POLICY
    status = Column(String, nullable=False) # MATCH, MISMATCH, WARNING, PASS, FAIL, NOT_APPLICABLE
    score = Column(Float, default=100.0, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="verification_results")

class TrustScore(Base):
    __tablename__ = "trust_scores"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id"), unique=True, nullable=False)
    identity_score = Column(Float, nullable=False)
    document_integrity_score = Column(Float, nullable=False)
    field_consistency_score = Column(Float, nullable=False)
    ocr_confidence_score = Column(Float, nullable=False)
    source_verification_score = Column(Float, nullable=False)
    transaction_risk_score = Column(Float, nullable=False)
    final_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False) # LOW_RISK, MEDIUM_RISK, HIGH_RISK
    explanation = Column(Text, nullable=True)
    ai_recommendation_supported = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="trust_scores")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False) # APPROVE, REJECT, REQUEST_VERIFICATION
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    case = relationship("Case", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    ip_hash_or_masked_ip = Column(String, default="127.0.***.***", nullable=False)
    prev_hash = Column(String, nullable=True)
    current_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="audit_logs")
    case = relationship("Case", back_populates="audit_logs")

class TrustedRegistryRecord(Base):
    __tablename__ = "trusted_registry_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    synthetic_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=False) # YYYY-MM-DD
    status = Column(String, default="ACTIVE", nullable=False) # ACTIVE, INACTIVE, SUSPENDED
    address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

class PolicyDocument(Base):
    __tablename__ = "policy_documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    version = Column(String, default="1.0", nullable=False)
    content_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
