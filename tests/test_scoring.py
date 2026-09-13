import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.scoring_service import scoring_service

def test_perfect_score_low_risk():
    res = scoring_service.calculate_trust_score(
        identity_score=100.0,
        document_integrity_score=100.0,
        field_consistency_score=100.0,
        ocr_confidence_score=100.0,
        source_verification_score=100.0,
        transaction_risk_score=100.0,
        ai_recommendation="APPROVE LOAN"
    )
    assert res["final_score"] == 100.0
    assert res["risk_level"] == "LOW_RISK"
    assert res["final_action_routing"] == "PROCEED"
    assert res["ai_recommendation_supported"] is True

def test_mismatched_demo_high_risk():
    # Identity=30, Integrity=55, Consistency=25, OCR=88, Source=25, Transaction=90
    # Expected = 0.30(30) + 0.20(55) + 0.15(25) + 0.10(88) + 0.15(25) + 0.10(90)
    # = 9 + 11 + 3.75 + 8.8 + 3.75 + 9.0 = 45.3
    res = scoring_service.calculate_trust_score(
        identity_score=30.0,
        document_integrity_score=55.0,
        field_consistency_score=25.0,
        ocr_confidence_score=88.0,
        source_verification_score=25.0,
        transaction_risk_score=90.0,
        ai_recommendation="APPROVE LOAN"
    )
    assert res["final_score"] == 45.3
    assert res["risk_level"] == "HIGH_RISK"
    assert res["final_action_routing"] == "HUMAN_REVIEW_REQUIRED"
    assert res["ai_recommendation_supported"] is False

def test_zero_identity_unknown_record():
    res = scoring_service.calculate_trust_score(
        identity_score=0.0,
        document_integrity_score=80.0,
        field_consistency_score=90.0,
        ocr_confidence_score=90.0,
        source_verification_score=10.0,
        transaction_risk_score=90.0
    )
    # 0 + 16 + 13.5 + 9 + 1.5 + 9 = 49.0
    assert res["final_score"] == 49.0
    assert res["risk_level"] == "HIGH_RISK"
    assert res["ai_recommendation_supported"] is False
