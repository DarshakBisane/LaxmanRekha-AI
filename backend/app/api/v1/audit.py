from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.db.session import get_db
from app.db.models import AuditLog, User, Case
from app.schemas.review_audit_health import AuditLogResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("", response_model=List[AuditLogResponse], summary="Retrieve tamper-evident audit trail")
def list_audit_logs(
    case_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["bank_officer", "reviewer", "admin"]))
):
    query = db.query(AuditLog).options(
        joinedload(AuditLog.user),
        joinedload(AuditLog.case)
    )

    if case_id:
        query = query.filter(AuditLog.case_id == case_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()

    result = []
    for l in logs:
        user_name = l.user.full_name if l.user else "System"
        case_num = l.case.case_number if l.case else None
        result.append(AuditLogResponse(
            id=l.id,
            user_id=l.user_id,
            user_name=user_name,
            case_id=l.case_id,
            case_number=case_num,
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            metadata_json=l.metadata_json,
            ip_hash_or_masked_ip=l.ip_hash_or_masked_ip,
            prev_hash=l.prev_hash,
            current_hash=l.current_hash,
            created_at=l.created_at
        ))
    return result
