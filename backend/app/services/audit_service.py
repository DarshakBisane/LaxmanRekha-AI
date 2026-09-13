import hashlib
import json
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.models import AuditLog
from app.core.security import mask_ip
from app.core.logging import logger

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        entity_type: str,
        user_id: Optional[str] = None,
        case_id: Optional[str] = None,
        entity_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """
        Creates an append-only, tamper-evident audit log with SHA-256 hash chaining.
        """
        # Fetch previous log for hash chaining
        last_log = db.query(AuditLog).order_by(desc(AuditLog.created_at)).first()
        prev_hash = last_log.current_hash if (last_log and last_log.current_hash) else "0000000000000000000000000000000000000000000000000000000000000000"

        # Sanitize metadata
        clean_meta = metadata.copy() if metadata else {}
        for sensitive_key in ["password", "secret", "token", "raw_document", "pan_raw"]:
            if sensitive_key in clean_meta:
                clean_meta[sensitive_key] = "[REDACTED]"

        meta_json_str = json.dumps(clean_meta, sort_keys=True)
        masked_ip = mask_ip(ip_address)

        # Compute SHA-256 hash chain
        hash_payload = f"{prev_hash}|{user_id}|{case_id}|{action}|{entity_type}|{meta_json_str}|{masked_ip}"
        current_hash = hashlib.sha256(hash_payload.encode("utf-8")).hexdigest()

        audit_entry = AuditLog(
            user_id=user_id,
            case_id=case_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=clean_meta,
            ip_hash_or_masked_ip=masked_ip,
            prev_hash=prev_hash,
            current_hash=current_hash
        )

        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)

        logger.info(f"Audit event recorded: [{action}] by user:{user_id or 'system'} on case:{case_id or 'none'}")
        return audit_entry

audit_service = AuditService()
