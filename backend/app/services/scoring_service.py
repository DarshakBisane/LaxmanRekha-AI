from typing import Dict, Any, Tuple

class ScoringService:
    # Component weights in standard specification
    WEIGHT_IDENTITY = 0.30
    WEIGHT_INTEGRITY = 0.20
    WEIGHT_CONSISTENCY = 0.15
    WEIGHT_OCR = 0.10
    WEIGHT_SOURCE = 0.15
    WEIGHT_TRANSACTION = 0.10

    @staticmethod
    def calculate_trust_score(
        identity_score: float,
        document_integrity_score: float,
        field_consistency_score: float,
        ocr_confidence_score: float,
        source_verification_score: float,
        transaction_risk_score: float,
        ai_recommendation: str = "APPROVE LOAN"
    ) -> Dict[str, Any]:
        """
        Calculates the deterministic Trust Score and risk classification.
        All input scores must be in range 0.0 - 100.0.
        """
        # Clamp inputs
        s_identity = max(0.0, min(100.0, float(identity_score)))
        s_integrity = max(0.0, min(100.0, float(document_integrity_score)))
        s_consistency = max(0.0, min(100.0, float(field_consistency_score)))
        s_ocr = max(0.0, min(100.0, float(ocr_confidence_score)))
        s_source = max(0.0, min(100.0, float(source_verification_score)))
        s_transaction = max(0.0, min(100.0, float(transaction_risk_score)))

        final_score = (
            (ScoringService.WEIGHT_IDENTITY * s_identity) +
            (ScoringService.WEIGHT_INTEGRITY * s_integrity) +
            (ScoringService.WEIGHT_CONSISTENCY * s_consistency) +
            (ScoringService.WEIGHT_OCR * s_ocr) +
            (ScoringService.WEIGHT_SOURCE * s_source) +
            (ScoringService.WEIGHT_TRANSACTION * s_transaction)
        )

        final_score = round(final_score, 1)

        # Risk level classification
        if final_score >= 80.0:
            risk_level = "LOW_RISK"
            routing = "PROCEED"
            rec_supported = True
            verdict = "SUPPORTED"
        elif final_score >= 60.0:
            risk_level = "MEDIUM_RISK"
            routing = "ADDITIONAL_VERIFICATION"
            rec_supported = False
            verdict = "CONDITIONALLY_SUPPORTED"
        else:
            risk_level = "HIGH_RISK"
            routing = "HUMAN_REVIEW_REQUIRED"
            rec_supported = False
            verdict = "NOT_SUPPORTED"

        return {
            "identity_score": s_identity,
            "document_integrity_score": s_integrity,
            "field_consistency_score": s_consistency,
            "ocr_confidence_score": s_ocr,
            "source_verification_score": s_source,
            "transaction_risk_score": s_transaction,
            "final_score": final_score,
            "risk_level": risk_level,
            "final_action_routing": routing,
            "ai_recommendation_supported": rec_supported,
            "recommendation_verdict": verdict
        }

scoring_service = ScoringService()
