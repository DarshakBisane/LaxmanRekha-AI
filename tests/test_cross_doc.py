import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.consistency_service import consistency_service

def test_single_doc_not_assessed():
    docs = [
        {"doc_type": "IDENTITY", "filename": "id.pdf", "fields": {"full_name": "Amit Patil"}}
    ]
    res = consistency_service.verify_cross_document(docs)
    assert res["status"] == "NOT_ASSESSED"
    assert res["field_consistency_score"] == 75.0
    assert "Single document submitted" in res["summary"]

def test_cross_doc_consistent():
    docs = [
        {"doc_type": "IDENTITY", "filename": "id.pdf", "fields": {"full_name": "Amit Patil"}},
        {"doc_type": "SALARY_SLIP", "filename": "sal.pdf", "fields": {"full_name": "Amit Patil"}},
        {"doc_type": "BANK_STATEMENT", "filename": "stmt.pdf", "fields": {"full_name": "Amit Patil"}}
    ]
    res = consistency_service.verify_cross_document(docs)
    assert res["status"] == "PASS"
    assert res["field_consistency_score"] >= 90.0
    assert len(res["conflicts"]) == 2
    assert all(c["status"] == "CONSISTENT" for c in res["conflicts"])

def test_cross_doc_conflict():
    docs = [
        {"doc_type": "IDENTITY", "filename": "id.pdf", "fields": {"full_name": "Rahul Sharma"}},
        {"doc_type": "SALARY_SLIP", "filename": "sal.pdf", "fields": {"full_name": "Rahul Sharma"}},
        {"doc_type": "BANK_STATEMENT", "filename": "stmt.pdf", "fields": {"full_name": "Amit Patil"}}
    ]
    res = consistency_service.verify_cross_document(docs)
    assert res["status"] == "FAIL"
    assert res["field_consistency_score"] <= 30.0
    conflicts = [c for c in res["conflicts"] if c["status"] == "CONFLICT"]
    assert len(conflicts) >= 1

