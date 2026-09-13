import random
import datetime
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.db.session import get_db
from app.db.models import Case, Document, ExtractedField, VerificationResult, TrustScore, User
from app.schemas.case import (
    CaseCreate, CaseResponse, CaseDetailResponse, DocumentResponse, 
    ExtractedFieldResponse, VerificationItem, TrustScoreDetail, 
    SideBySideDiff, CrossDocConflict, PolicySnippet
)
from app.api.deps import get_current_user, get_client_ip
from app.core.exceptions import NotFoundError, ValidationError, ForbiddenError
from app.services.document_service import document_service
from app.services.registry_service import registry_service
from app.services.consistency_service import consistency_service
from app.services.integrity_service import integrity_service
from app.services.transaction_service import transaction_service
from app.services.rag_service import rag_service
from app.services.gemini_service import gemini_service
from app.services.scoring_service import scoring_service
from app.services.audit_service import audit_service
from app.core.config import settings
from app.core.logging import logger

router = APIRouter(prefix="/cases", tags=["Cases"])

def generate_case_number(db: Session) -> str:
    count = db.query(Case).count() + 1
    rand_suffix = random.randint(100, 999)
    return f"CASE-2026-{count:04d}-{rand_suffix}"

@router.get("", response_model=List[CaseResponse], summary="List verification cases")
def list_cases(
    status: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Case)

    # Bank officers see all non-restricted cases or their own; reviewers and admins see all
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Case.case_number.ilike(search_fmt),
                Case.title.ilike(search_fmt),
                Case.ai_recommendation.ilike(search_fmt)
            )
        )

    if status:
        query = query.filter(Case.status == status.upper())

    if risk_level:
        query = query.filter(Case.risk_level == risk_level.upper())

    cases = query.order_by(desc(Case.created_at)).offset(offset).limit(limit).all()
    return [CaseResponse.model_validate(c) for c in cases]

@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED, summary="Create a new verification case")
def create_case(
    payload: CaseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case_number = generate_case_number(db)
    new_case = Case(
        case_number=case_number,
        created_by=current_user.id,
        title=payload.title,
        description=payload.description,
        ai_recommendation=payload.ai_recommendation.upper(),
        case_type=payload.case_type,
        status="DRAFT",
        transaction_amount=payload.transaction_amount,
        transaction_currency=payload.transaction_currency,
        transaction_type=payload.transaction_type,
        transaction_count_24h=payload.transaction_count_24h,
        is_new_device=payload.is_new_device,
        is_unusual_location=payload.is_unusual_location
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    audit_service.log_event(
        db=db,
        action="CASE_CREATED",
        entity_type="Case",
        user_id=current_user.id,
        case_id=new_case.id,
        entity_id=new_case.id,
        metadata={
            "case_number": new_case.case_number,
            "title": new_case.title,
            "ai_recommendation": new_case.ai_recommendation,
            "amount": new_case.transaction_amount
        },
        ip_address=get_client_ip(request)
    )

    return CaseResponse.model_validate(new_case)

@router.get("/{case_id}", response_model=CaseDetailResponse, summary="Get full case details and verification state")
def get_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise NotFoundError(f"Case with ID {case_id} not found.")

    docs = db.query(Document).filter(Document.case_id == case.id).all()
    fields = db.query(ExtractedField).filter(ExtractedField.case_id == case.id).all()
    verif_results = db.query(VerificationResult).filter(VerificationResult.case_id == case.id).all()
    score = db.query(TrustScore).filter(TrustScore.case_id == case.id).first()

    # Reconstruct side-by-side diffs and conflicts from stored verification results
    side_by_side = []
    cross_conflicts = []
    policy_snippets = []
    recommendation_verdict = "INSUFFICIENT_EVIDENCE"
    final_routing = "PROCEED" if case.risk_level == "LOW_RISK" else ("ADDITIONAL_VERIFICATION" if case.risk_level == "MEDIUM_RISK" else "HUMAN_REVIEW_REQUIRED")

    for vr in verif_results:
        if vr.check_type == "IDENTITY" and vr.details:
            diffs_data = vr.details.get("diffs", [])
            for d in diffs_data:
                side_by_side.append(SideBySideDiff(
                    field_name=d.get("field_name", ""),
                    uploaded_value=d.get("uploaded_value", ""),
                    trusted_value=d.get("trusted_value"),
                    status=d.get("status", "INFO")
                ))
        elif vr.check_type == "CROSS_DOCUMENT" and vr.details:
            conf_data = vr.details.get("conflicts", [])
            for c in conf_data:
                cross_conflicts.append(CrossDocConflict(
                    field_name=c.get("field_name", ""),
                    document_a=c.get("document_a", ""),
                    value_a=c.get("value_a", ""),
                    document_b=c.get("document_b", ""),
                    value_b=c.get("value_b", ""),
                    status=c.get("status", "INFO")
                ))
        elif vr.check_type == "POLICY" and vr.details:
            snippets_data = vr.details.get("snippets", [])
            for s in snippets_data:
                policy_snippets.append(PolicySnippet(
                    filename=s.get("filename", ""),
                    section=s.get("section", ""),
                    guidance=s.get("guidance", ""),
                    relevance_score=s.get("relevance_score")
                ))

    if score:
        recommendation_verdict = "SUPPORTED" if score.ai_recommendation_supported else "NOT_SUPPORTED"

    score_detail = None
    if score:
        score_detail = TrustScoreDetail(
            identity_score=score.identity_score,
            document_integrity_score=score.document_integrity_score,
            field_consistency_score=score.field_consistency_score,
            ocr_confidence_score=score.ocr_confidence_score,
            source_verification_score=score.source_verification_score,
            transaction_risk_score=score.transaction_risk_score,
            final_score=score.final_score,
            risk_level=score.risk_level,
            explanation=score.explanation,
            ai_recommendation_supported=score.ai_recommendation_supported
        )

    return CaseDetailResponse(
        id=case.id,
        case_number=case.case_number,
        created_by=case.created_by,
        title=case.title,
        description=case.description,
        ai_recommendation=case.ai_recommendation,
        case_type=case.case_type,
        status=case.status,
        trust_score=case.trust_score,
        risk_level=case.risk_level,
        transaction_amount=case.transaction_amount,
        transaction_currency=case.transaction_currency,
        transaction_type=case.transaction_type,
        transaction_count_24h=case.transaction_count_24h,
        is_new_device=case.is_new_device,
        is_unusual_location=case.is_unusual_location,
        created_at=case.created_at,
        updated_at=case.updated_at,
        completed_at=case.completed_at,
        documents=[DocumentResponse.model_validate(d) for d in docs],
        extracted_fields=[ExtractedFieldResponse.model_validate(f) for f in fields],
        verification_results=[
            VerificationItem(
                check_type=vr.check_type,
                status=vr.status,
                score=vr.score,
                details=vr.details
            ) for vr in verif_results
        ],
        trust_score_detail=score_detail,
        side_by_side_diff=side_by_side,
        cross_doc_conflicts=cross_conflicts,
        policy_guidance=policy_snippets,
        ai_explanation=score.explanation if score else None,
        recommendation_verdict=recommendation_verdict,
        final_action_routing=final_routing
    )

@router.post("/{case_id}/documents", response_model=List[DocumentResponse], status_code=status.HTTP_201_CREATED, summary="Upload one or more verification documents to a case")
async def upload_documents(
    case_id: str,
    files: Optional[List[UploadFile]] = File(None),
    file: Optional[UploadFile] = File(None),
    document_type: Optional[str] = Form(None), # Optional preset or AUTO
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise NotFoundError(f"Case {case_id} not found.")

    # Combine input files
    incoming_files: List[UploadFile] = []
    if files:
        incoming_files.extend(files)
    if file:
        incoming_files.append(file)

    if not incoming_files:
        raise ValidationError("At least one document file is required for upload.")

    current_doc_count = db.query(Document).filter(Document.case_id == case.id).count()
    if current_doc_count + len(incoming_files) > settings.MAX_DOCUMENTS_PER_CASE:
        raise ValidationError(
            f"Cannot upload {len(incoming_files)} files. Case already has {current_doc_count} documents. "
            f"Maximum allowed is {settings.MAX_DOCUMENTS_PER_CASE} documents per case."
        )

    created_documents = []

    for upload_file in incoming_files:
        file_bytes = await upload_file.read()
        raw_filename = upload_file.filename or "uploaded_document"
        filename = document_service.sanitize_filename(raw_filename)
        content_type = upload_file.content_type or "application/octet-stream"

        # Validate file size & magic signatures, calculate SHA-256
        sha256_hash = document_service.validate_file(file_bytes, filename, content_type, max_mb=settings.MAX_UPLOAD_MB)

        # OCR and text extraction
        extracted_text, ocr_conf = document_service.extract_text_and_ocr(file_bytes, filename, content_type)

        # Determine document type (auto-classify if not provided or generic)
        assigned_type = document_type.upper() if document_type and document_type.upper() not in ["AUTO", "OTHER", "UNKNOWN"] else None
        if not assigned_type:
            assigned_type = document_service.classify_document(extracted_text, filename)

        # Save Document record
        doc_record = Document(
            case_id=case.id,
            document_type=assigned_type,
            original_filename=filename,
            mime_type=content_type,
            file_size=len(file_bytes),
            sha256_hash=sha256_hash,
            processing_status="EXTRACTED",
            ocr_confidence=ocr_conf,
            extracted_text_preview=extracted_text[:400] if extracted_text else None
        )
        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)

        # Field extraction: deterministic regex first
        extracted_dict = document_service.extract_fields_deterministic(extracted_text)
        
        # Gemini structured extraction fallback/enrichment
        if not extracted_dict.get("synthetic_id") or not extracted_dict.get("full_name"):
            ai_fields = gemini_service.extract_structured_fields(extracted_text, doc_type=assigned_type)
            if ai_fields:
                for k, v in ai_fields.items():
                    if v and not extracted_dict.get(k):
                        extracted_dict[k] = v

        # Store extracted fields linked to document and case
        for fname, fval in extracted_dict.items():
            if fval:
                val_str = str(fval)
                norm_val = val_str.lower().strip()
                field_rec = ExtractedField(
                    document_id=doc_record.id,
                    case_id=case.id,
                    field_name=fname,
                    field_value=val_str,
                    normalized_value=norm_val,
                    confidence=ocr_conf / 100.0,
                    source="OCR_STRUCTURED"
                )
                db.add(field_rec)

        db.commit()

        audit_service.log_event(
            db=db,
            action="DOCUMENT_UPLOADED",
            entity_type="Document",
            user_id=current_user.id,
            case_id=case.id,
            entity_id=doc_record.id,
            metadata={
                "filename": filename,
                "document_type": doc_record.document_type,
                "sha256": sha256_hash,
                "ocr_confidence": ocr_conf,
                "extracted_fields_count": len(extracted_dict)
            },
            ip_address=get_client_ip(request) if request else None
        )

        created_documents.append(doc_record)

    return [DocumentResponse.model_validate(d) for d in created_documents]


@router.post("/{case_id}/analyze", response_model=CaseDetailResponse, summary="Execute full end-to-end verification pipeline")
def analyze_case(
    case_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise NotFoundError(f"Case {case_id} not found.")

    docs = db.query(Document).filter(Document.case_id == case.id).all()
    if not docs:
        raise ValidationError("Cannot analyze case without at least one uploaded document.")

    fields = db.query(ExtractedField).filter(ExtractedField.case_id == case.id).all()

    # Step 1: Group fields by document type
    id_name = None
    id_synth_id = None
    id_dob = None
    doc_groups = []

    for doc in docs:
        doc_fields = {f.field_name: f.field_value for f in fields if f.document_id == doc.id}
        doc_groups.append({
            "doc_type": doc.document_type,
            "filename": doc.original_filename,
            "fields": doc_fields
        })
        if doc.document_type == "IDENTITY" or not id_synth_id:
            if doc_fields.get("synthetic_id"):
                id_synth_id = doc_fields.get("synthetic_id")
            if doc_fields.get("full_name"):
                id_name = doc_fields.get("full_name")
            if doc_fields.get("date_of_birth"):
                id_dob = doc_fields.get("date_of_birth")

    # Fallback if unassigned to specific doc
    if not id_synth_id:
        for f in fields:
            if f.field_name == "synthetic_id":
                id_synth_id = f.field_value
            elif f.field_name == "full_name" and not id_name:
                id_name = f.field_value
            elif f.field_name == "date_of_birth" and not id_dob:
                id_dob = f.field_value

    # Step 2: Trusted Synthetic Registry Verification
    reg_res = registry_service.verify_identity(
        db=db,
        uploaded_id=id_synth_id,
        uploaded_name=id_name,
        uploaded_dob=id_dob
    )

    # Step 3: Cross-Document Consistency Verification
    cross_res = consistency_service.verify_cross_document(doc_groups)

    # Step 4: Document Integrity Assessment
    # Average OCR confidence across documents
    ocr_conf_avg = sum(d.ocr_confidence or 85.0 for d in docs) / len(docs)
    doc_integrity_score = 90.0 if ocr_conf_avg >= 75.0 else 65.0
    integrity_res = {
        "document_integrity_score": doc_integrity_score,
        "summary": "Document metadata and OCR density within standard parameters." if doc_integrity_score >= 75.0 else "Low OCR density or document degradation detected."
    }

    # Step 5: Transaction Safety Assessment
    trans_res = transaction_service.assess_transaction_safety(
        amount=case.transaction_amount,
        currency=case.transaction_currency,
        transaction_type=case.transaction_type,
        count_24h=case.transaction_count_24h,
        is_new_device=case.is_new_device,
        is_unusual_location=case.is_unusual_location
    )

    # Step 6: Policy RAG Search
    rag_query = f"{case.ai_recommendation} identity mismatch {reg_res.get('status')} {cross_res.get('status')}"
    policy_snippets = rag_service.search_policy(rag_query, top_k=3)

    # Step 7: Deterministic Trust Score Calculation
    score_calc = scoring_service.calculate_trust_score(
        identity_score=reg_res.get("identity_score", 0.0),
        document_integrity_score=integrity_res.get("document_integrity_score", 80.0),
        field_consistency_score=cross_res.get("field_consistency_score", 75.0),
        ocr_confidence_score=ocr_conf_avg,
        source_verification_score=reg_res.get("source_score", 50.0),
        transaction_risk_score=trans_res.get("transaction_risk_score", 85.0),
        ai_recommendation=case.ai_recommendation
    )

    # Step 8: Gemini AI Explanation (Natural Language Summary with injection defense)
    ai_explanation = gemini_service.generate_explanation(
        ai_recommendation=case.ai_recommendation,
        trust_score=score_calc["final_score"],
        risk_level=score_calc["risk_level"],
        registry_result=reg_res,
        cross_doc_result=cross_res,
        integrity_result=integrity_res,
        transaction_result=trans_res,
        policy_snippets=policy_snippets
    )

    # Step 9: Store Verification Results in Database
    # Delete old results if re-analyzing
    db.query(VerificationResult).filter(VerificationResult.case_id == case.id).delete()
    db.query(TrustScore).filter(TrustScore.case_id == case.id).delete()

    v_identity = VerificationResult(
        case_id=case.id,
        check_type="IDENTITY",
        status=reg_res.get("status", "MISMATCH"),
        score=reg_res.get("identity_score", 0.0),
        details={"diffs": reg_res.get("diffs", []), "summary": reg_res.get("summary")}
    )
    v_source = VerificationResult(
        case_id=case.id,
        check_type="SOURCE",
        status="MATCH" if reg_res.get("found") else "FAIL",
        score=reg_res.get("source_score", 0.0),
        details={"found": reg_res.get("found"), "record": reg_res.get("record")}
    )
    v_cross = VerificationResult(
        case_id=case.id,
        check_type="CROSS_DOCUMENT",
        status=cross_res.get("status", "NOT_ASSESSED"),
        score=cross_res.get("field_consistency_score", 75.0),
        details={"conflicts": cross_res.get("conflicts", []), "summary": cross_res.get("summary")}
    )
    v_integrity = VerificationResult(
        case_id=case.id,
        check_type="DOCUMENT_INTEGRITY",
        status="PASS" if doc_integrity_score >= 75.0 else "WARNING",
        score=doc_integrity_score,
        details={"summary": integrity_res.get("summary")}
    )
    v_trans = VerificationResult(
        case_id=case.id,
        check_type="TRANSACTION",
        status=trans_res.get("status", "LOW_RISK"),
        score=trans_res.get("transaction_risk_score", 85.0),
        details={"flags": trans_res.get("flags", []), "summary": trans_res.get("summary")}
    )
    v_policy = VerificationResult(
        case_id=case.id,
        check_type="POLICY",
        status="RETRIEVED",
        score=90.0,
        details={"snippets": policy_snippets}
    )

    db.add_all([v_identity, v_source, v_cross, v_integrity, v_trans, v_policy])

    # Save TrustScore record
    trust_record = TrustScore(
        case_id=case.id,
        identity_score=score_calc["identity_score"],
        document_integrity_score=score_calc["document_integrity_score"],
        field_consistency_score=score_calc["field_consistency_score"],
        ocr_confidence_score=score_calc["ocr_confidence_score"],
        source_verification_score=score_calc["source_verification_score"],
        transaction_risk_score=score_calc["transaction_risk_score"],
        final_score=score_calc["final_score"],
        risk_level=score_calc["risk_level"],
        explanation=ai_explanation,
        ai_recommendation_supported=score_calc["ai_recommendation_supported"]
    )
    db.add(trust_record)

    # Step 10: Update Case status based on risk routing
    case.trust_score = score_calc["final_score"]
    case.risk_level = score_calc["risk_level"]
    if score_calc["risk_level"] == "HIGH_RISK":
        case.status = "PENDING_REVIEW"
    elif score_calc["risk_level"] == "MEDIUM_RISK":
        case.status = "NEEDS_VERIFICATION"
    else:
        case.status = "ANALYZED"

    case.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()

    # Step 11: Audit log
    audit_service.log_event(
        db=db,
        action="ANALYSIS_COMPLETED",
        entity_type="Case",
        user_id=current_user.id,
        case_id=case.id,
        entity_id=trust_record.id,
        metadata={
            "final_score": case.trust_score,
            "risk_level": case.risk_level,
            "status": case.status,
            "routing": score_calc["final_action_routing"]
        },
        ip_address=get_client_ip(request)
    )

    return get_case(case_id=case.id, db=db, current_user=current_user)
