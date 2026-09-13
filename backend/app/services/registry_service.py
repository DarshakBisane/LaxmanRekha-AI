from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.db.models import TrustedRegistryRecord
from app.services.normalization_service import normalization_service

class RegistryService:
    @staticmethod
    def verify_identity(
        db: Session,
        uploaded_id: Optional[str],
        uploaded_name: Optional[str],
        uploaded_dob: Optional[str]
    ) -> Dict[str, Any]:
        """
        Deterministic verification against Trusted Verification Registry (Synthetic Dataset).
        """
        norm_id = normalization_service.normalize_id(uploaded_id)
        norm_dob = normalization_service.normalize_date(uploaded_dob)
        
        diffs: List[Dict[str, Any]] = []
        
        if not norm_id:
            diffs.append({
                "field_name": "Synthetic ID",
                "uploaded_value": uploaded_id or "Not Provided",
                "trusted_value": "Required",
                "status": "NOT_FOUND"
            })
            return {
                "found": False,
                "identity_score": 0.0,
                "source_score": 0.0,
                "status": "NOT_FOUND",
                "summary": "No synthetic identity identifier provided in uploaded documents.",
                "diffs": diffs
            }

        # Query database for synthetic record
        record: Optional[TrustedRegistryRecord] = db.query(TrustedRegistryRecord).filter(
            TrustedRegistryRecord.synthetic_id == norm_id
        ).first()

        if not record:
            diffs.append({
                "field_name": "Synthetic ID",
                "uploaded_value": norm_id,
                "trusted_value": "Not in Synthetic Registry",
                "status": "NOT_FOUND"
            })
            return {
                "found": False,
                "identity_score": 0.0,
                "source_score": 10.0, # Failed trusted source resolution
                "status": "NOT_FOUND",
                "summary": f"Synthetic identifier '{norm_id}' is not registered in the Trusted Verification Registry.",
                "diffs": diffs
            }

        # Field 1: ID Match
        diffs.append({
            "field_name": "Synthetic ID",
            "uploaded_value": norm_id,
            "trusted_value": record.synthetic_id,
            "status": "MATCH"
        })

        # Field 2: Name Match
        name_match, name_sim = normalization_service.compare_names(uploaded_name, record.name)
        if name_match:
            name_status = "MATCH"
        elif name_sim >= 70.0:
            name_status = "WARNING"
        else:
            name_status = "MISMATCH"

        diffs.append({
            "field_name": "Full Name",
            "uploaded_value": uploaded_name or "Not Extracted",
            "trusted_value": record.name,
            "status": name_status
        })

        # Field 3: DOB Match
        reg_dob_norm = normalization_service.normalize_date(record.date_of_birth)
        dob_match = (norm_dob == reg_dob_norm) if norm_dob and reg_dob_norm else False
        diffs.append({
            "field_name": "Date of Birth",
            "uploaded_value": norm_dob or uploaded_dob or "Not Extracted",
            "trusted_value": record.date_of_birth,
            "status": "MATCH" if dob_match else ("MISMATCH" if norm_dob else "NOT_FOUND")
        })

        # Field 4: Status Check
        status_active = record.status.upper() == "ACTIVE"
        diffs.append({
            "field_name": "Registry Status",
            "uploaded_value": "—",
            "trusted_value": record.status,
            "status": "VERIFIED" if status_active else "SUSPENDED"
        })

        # Deterministic Identity Component Scoring (0 - 100):
        # Weights: Name (40%), ID Found (30%), DOB (20%), Status Active (10%)
        id_score = 30.0 # ID exists
        if name_match:
            id_score += 40.0
        elif name_sim >= 70.0:
            id_score += (name_sim / 100.0) * 30.0
        else:
            id_score += 0.0 # Clear name mismatch

        if dob_match:
            id_score += 20.0
        elif norm_dob:
            id_score += 0.0
        else:
            id_score += 10.0 # Neutral if unextracted

        if status_active:
            id_score += 10.0

        # Source verification score:
        source_score = 95.0 if (name_match and status_active and dob_match) else (50.0 if not name_match else 25.0)

        # Summary formulation
        if name_match and dob_match and status_active:
            summary = "Trusted Registry match confirmed. All identity fields correlate with active registry record."
            overall_status = "MATCH"
        elif not name_match:
            summary = f"Identity mismatch detected: submitted name '{uploaded_name}' does not match registered name '{record.name}' for {norm_id}."
            overall_status = "MISMATCH"
        elif not dob_match:
            summary = f"DOB discrepancy detected: submitted date '{uploaded_dob}' does not match registered date '{record.date_of_birth}'."
            overall_status = "MISMATCH"
        elif not status_active:
            summary = f"Credential warning: synthetic record {norm_id} is currently {record.status}."
            overall_status = "WARNING"
        else:
            summary = "Partial identity match with registry warnings."
            overall_status = "WARNING"

        return {
            "found": True,
            "identity_score": round(id_score, 1),
            "source_score": round(source_score, 1),
            "status": overall_status,
            "summary": summary,
            "diffs": diffs,
            "record": {
                "synthetic_id": record.synthetic_id,
                "name": record.name,
                "date_of_birth": record.date_of_birth,
                "status": record.status,
                "address": record.address
            }
        }

registry_service = RegistryService()
