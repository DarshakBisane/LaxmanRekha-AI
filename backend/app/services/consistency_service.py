from typing import List, Dict, Any, Optional
from app.services.normalization_service import normalization_service

class ConsistencyService:
    @staticmethod
    def verify_cross_document(
        documents_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluates consistency across multiple submitted documents (e.g. Identity, Salary Slip, Bank Statement).
        Returns conflicts, status (PASS, FAIL, NOT_ASSESSED), summary, and score.
        """
        conflicts: List[Dict[str, Any]] = []

        if len(documents_data) <= 1:
            return {
                "field_consistency_score": 75.0,
                "status": "NOT_ASSESSED",
                "summary": "Single document submitted. Multi-document cross-consistency signal not assessed.",
                "conflicts": []
            }

        # 1. Compare Applicant Names across all document pairs
        name_entries = []
        dob_entries = []
        id_entries = []

        for doc in documents_data:
            fields = doc.get("fields", {})
            doc_type = doc.get("doc_type", "UNKNOWN")
            filename = doc.get("filename", "Document")

            if fields.get("full_name"):
                name_entries.append({
                    "doc_type": doc_type,
                    "filename": filename,
                    "val": fields.get("full_name")
                })
            if fields.get("date_of_birth"):
                dob_entries.append({
                    "doc_type": doc_type,
                    "filename": filename,
                    "val": fields.get("date_of_birth")
                })
            if fields.get("synthetic_id"):
                id_entries.append({
                    "doc_type": doc_type,
                    "filename": filename,
                    "val": fields.get("synthetic_id")
                })

        has_mismatch = False

        # Name Comparisons
        if len(name_entries) >= 2:
            base_name = name_entries[0]
            for comp in name_entries[1:]:
                is_match, sim = normalization_service.compare_names(base_name["val"], comp["val"])
                if not is_match:
                    has_mismatch = True
                    conflicts.append({
                        "field_name": "Applicant / Account Holder Name",
                        "document_a": f"{base_name['doc_type']} ({base_name['filename']})",
                        "value_a": base_name["val"],
                        "document_b": f"{comp['doc_type']} ({comp['filename']})",
                        "value_b": comp["val"],
                        "status": "CONFLICT"
                    })
                else:
                    conflicts.append({
                        "field_name": "Applicant / Account Holder Name",
                        "document_a": f"{base_name['doc_type']} ({base_name['filename']})",
                        "value_a": base_name["val"],
                        "document_b": f"{comp['doc_type']} ({comp['filename']})",
                        "value_b": comp["val"],
                        "status": "CONSISTENT"
                    })

        # DOB Comparisons
        if len(dob_entries) >= 2:
            base_dob = dob_entries[0]
            for comp in dob_entries[1:]:
                if base_dob["val"] != comp["val"]:
                    has_mismatch = True
                    conflicts.append({
                        "field_name": "Date of Birth",
                        "document_a": f"{base_dob['doc_type']} ({base_dob['filename']})",
                        "value_a": base_dob["val"],
                        "document_b": f"{comp['doc_type']} ({comp['filename']})",
                        "value_b": comp["val"],
                        "status": "CONFLICT"
                    })
                else:
                    conflicts.append({
                        "field_name": "Date of Birth",
                        "document_a": f"{base_dob['doc_type']} ({base_dob['filename']})",
                        "value_a": base_dob["val"],
                        "document_b": f"{comp['doc_type']} ({comp['filename']})",
                        "value_b": comp["val"],
                        "status": "CONSISTENT"
                    })

        # ID Comparisons
        if len(id_entries) >= 2:
            base_id = id_entries[0]
            for comp in id_entries[1:]:
                if base_id["val"] != comp["val"]:
                    has_mismatch = True
                    conflicts.append({
                        "field_name": "Identity / PAN Identifier",
                        "document_a": f"{base_id['doc_type']} ({base_id['filename']})",
                        "value_a": base_id["val"],
                        "document_b": f"{comp['doc_type']} ({comp['filename']})",
                        "value_b": comp["val"],
                        "status": "CONFLICT"
                    })
                else:
                    conflicts.append({
                        "field_name": "Identity / PAN Identifier",
                        "document_a": f"{base_id['doc_type']} ({base_id['filename']})",
                        "value_a": base_id["val"],
                        "document_b": f"{comp['doc_type']} ({comp['filename']})",
                        "value_b": comp["val"],
                        "status": "CONSISTENT"
                    })

        if has_mismatch:
            score = 25.0
            status = "FAIL"
            summary = f"Cross-document inconsistency detected across {len([c for c in conflicts if c['status'] == 'CONFLICT'])} field pairs."
        elif conflicts:
            score = 95.0
            status = "PASS"
            summary = "Cross-document field correlation verified. All applicant parameters align across instruments."
        else:
            score = 80.0
            status = "NOT_ASSESSED"
            summary = f"{len(documents_data)} documents evaluated, but no overlapping key fields (Full Name, Date of Birth, or ID) were detected across instruments for pairwise cross-matching."
            conflicts.append({
                "field_name": "Multi-Document Key Field Correlation",
                "document_a": f"{len(documents_data)} Attached Instruments",
                "value_a": "No Overlapping Fields Found",
                "document_b": "Pairwise Verification",
                "value_b": "Unassessed",
                "status": "NOT_ASSESSED"
            })

        return {
            "field_consistency_score": score,
            "status": status,
            "summary": summary,
            "conflicts": conflicts
        }

consistency_service = ConsistencyService()

