from typing import List, Optional
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.db.models import Case, Review, User
from app.schemas.case import CaseResponse
from app.schemas.review_audit_health import ReviewCreate, ReviewResponse
from app.api.deps import get_current_user, require_roles, get_client_ip
from app.services.review_service import review_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.get("/pending", response_model=List[CaseResponse], summary="List cases pending human review")
def list_pending_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["reviewer", "admin", "bank_officer"]))
):
    cases = db.query(Case).filter(
        Case.status.in_(["PENDING_REVIEW", "NEEDS_VERIFICATION"])
    ).order_by(desc(Case.updated_at)).all()
    return [CaseResponse.model_validate(c) for c in cases]

@router.post("/{case_id}/approve", response_model=ReviewResponse, summary="Approve escalated case")
def approve_case(
    case_id: str,
    payload: Optional[ReviewCreate] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["reviewer", "admin"]))
):
    comment = payload.comment if payload else "Approved by reviewer."
    res = review_service.process_review(
        db=db,
        case_id=case_id,
        reviewer=current_user,
        action="APPROVE",
        comment=comment,
        ip_address=get_client_ip(request) if request else None
    )
    return ReviewResponse(
        id=res["review_id"],
        case_id=res["case_id"],
        reviewer_id=current_user.id,
        reviewer_name=current_user.full_name,
        action="APPROVE",
        comment=res["comment"],
        created_at=res["created_at"]
    )

@router.post("/{case_id}/reject", response_model=ReviewResponse, summary="Reject escalated case")
def reject_case(
    case_id: str,
    payload: ReviewCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["reviewer", "admin"]))
):
    res = review_service.process_review(
        db=db,
        case_id=case_id,
        reviewer=current_user,
        action="REJECT",
        comment=payload.comment,
        ip_address=get_client_ip(request)
    )
    return ReviewResponse(
        id=res["review_id"],
        case_id=res["case_id"],
        reviewer_id=current_user.id,
        reviewer_name=current_user.full_name,
        action="REJECT",
        comment=res["comment"],
        created_at=res["created_at"]
    )

@router.post("/{case_id}/request-verification", response_model=ReviewResponse, summary="Request additional verification")
def request_verification_case(
    case_id: str,
    payload: ReviewCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["reviewer", "admin"]))
):
    res = review_service.process_review(
        db=db,
        case_id=case_id,
        reviewer=current_user,
        action="REQUEST_VERIFICATION",
        comment=payload.comment,
        ip_address=get_client_ip(request)
    )
    return ReviewResponse(
        id=res["review_id"],
        case_id=res["case_id"],
        reviewer_id=current_user.id,
        reviewer_name=current_user.full_name,
        action="REQUEST_VERIFICATION",
        comment=res["comment"],
        created_at=res["created_at"]
    )
