import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Case, Review, User
from app.core.exceptions import ValidationError, NotFoundError, ForbiddenError
from app.services.audit_service import audit_service
from app.services.redis_service import redis_service

class ReviewService:
    @staticmethod
    def process_review(
        db: Session,
        case_id: str,
        reviewer: User,
        action: str,
        comment: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a human reviewer action on a case.
        """
        if reviewer.role not in ["reviewer", "admin"]:
            raise ForbiddenError("Only users with 'reviewer' or 'admin' roles can perform case reviews.")

        case: Optional[Case] = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise NotFoundError(f"Case {case_id} not found.")

        valid_actions = ["APPROVE", "REJECT", "REQUEST_VERIFICATION"]
        if action not in valid_actions:
            raise ValidationError(f"Invalid review action '{action}'. Must be one of {valid_actions}.")

        if action in ["REJECT", "REQUEST_VERIFICATION"] and (not comment or len(comment.strip()) < 5):
            raise ValidationError(f"A detailed comment (minimum 5 characters) is mandatory when selecting {action}.")

        # Create review record
        review = Review(
            case_id=case.id,
            reviewer_id=reviewer.id,
            action=action,
            comment=comment.strip() if comment else "Approved by authorized reviewer."
        )
        db.add(review)

        # Update case status
        if action == "APPROVE":
            case.status = "APPROVED"
            case.completed_at = datetime.datetime.now(datetime.timezone.utc)
        elif action == "REJECT":
            case.status = "REJECTED"
            case.completed_at = datetime.datetime.now(datetime.timezone.utc)
        elif action == "REQUEST_VERIFICATION":
            case.status = "NEEDS_VERIFICATION"

        case.updated_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(case)
        db.refresh(review)

        # Invalidate dashboard summary cache
        redis_service.delete("analytics:dashboard_summary")

        # Audit log
        audit_service.log_event(
            db=db,
            action=f"CASE_{action}",
            entity_type="Case",
            user_id=reviewer.id,
            case_id=case.id,
            entity_id=review.id,
            metadata={
                "action": action,
                "comment": comment,
                "previous_status": "PENDING_REVIEW",
                "new_status": case.status,
                "trust_score": case.trust_score
            },
            ip_address=ip_address
        )

        return {
            "review_id": review.id,
            "case_id": case.id,
            "case_status": case.status,
            "action": action,
            "comment": review.comment,
            "created_at": review.created_at
        }

review_service = ReviewService()
