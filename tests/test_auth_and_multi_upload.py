import pytest
import sys
import os
import io
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import hash_password, verify_password

client = TestClient(app)

def test_password_hashing_security():
    pwd = "123321123"
    hashed = hash_password(pwd)
    assert hashed.startswith("pbkdf2_sha256$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_bank_officer_credentials():
    # Correct login
    res = client.post("/api/v1/auth/login", json={
        "email": "darshak@gmail.com",
        "password": "123321123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "darshak@gmail.com"
    assert data["user"]["full_name"] == "Darshak K. Bisane"
    assert data["user"]["role"] == "bank_officer"
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]

    token = data["access_token"]

    # Verify /me endpoint
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["user"]["email"] == "darshak@gmail.com"

def test_bank_officer_invalid_credentials():
    # Wrong password
    res = client.post("/api/v1/auth/login", json={
        "email": "darshak@gmail.com",
        "password": "wrong_password_123"
    })
    assert res.status_code == 401
    assert "Invalid" in res.json()["error"]["message"]

    # Unknown user
    res2 = client.post("/api/v1/auth/login", json={
        "email": "intruder@bank.com",
        "password": "somepassword"
    })
    assert res2.status_code == 401
    assert "Invalid" in res2.json()["error"]["message"]

def test_logout_endpoint():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "darshak@gmail.com",
        "password": "123321123"
    })
    token = login_res.json()["access_token"]
    
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    res_data = logout_res.json()
    assert "Successfully logged out." in str(res_data)

def test_multi_document_case_flow():
    # 1. Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "darshak@gmail.com",
        "password": "123321123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a Case
    case_payload = {
        "title": "Loan Application - Multi-Doc Verification Test",
        "description": "Testing multi-instrument verification flow",
        "ai_recommendation": "APPROVE LOAN",
        "case_type": "LOAN_APPLICATION",
        "transaction_amount": 1500000.0,
        "transaction_currency": "INR",
        "transaction_type": "LOAN_DISBURSEMENT",
        "transaction_count_24h": 1,
        "is_new_device": False,
        "is_unusual_location": False
    }
    create_res = client.post("/api/v1/cases", json=case_payload, headers=headers)
    assert create_res.status_code in [200, 201]
    case_id = create_res.json()["id"]

    # 3. Upload Multiple Documents (PDF, PNG) to single case
    pdf_content = b"%PDF-1.4 Identity Document for Amit Patil DOB 2002-05-10 ID SYNTH-1234-A"
    png_content = b"\x89PNG\r\n\x1a\nSalary Slip for Amit Patil Monthly Income 120000"
    
    files = [
        ("files", ("identity_doc.pdf", io.BytesIO(pdf_content), "application/pdf")),
        ("files", ("salary_slip.png", io.BytesIO(png_content), "image/png"))
    ]
    doc_types = ["IDENTITY", "SALARY_SLIP"]

    upload_res = client.post(
        f"/api/v1/cases/{case_id}/documents",
        files=files,
        headers=headers
    )
    assert upload_res.status_code in [200, 201]
    uploaded_docs = upload_res.json()
    assert len(uploaded_docs) == 2
    assert uploaded_docs[0]["case_id"] == case_id
    assert uploaded_docs[1]["case_id"] == case_id

    # 4. Trigger Batch Analysis
    analyze_res = client.post(f"/api/v1/cases/{case_id}/analyze", headers=headers)
    assert analyze_res.status_code == 200
    detail = analyze_res.json()
    assert detail["id"] == case_id
    assert len(detail["documents"]) == 2
    assert detail["trust_score"] is not None
    assert detail["risk_level"] in ["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"]
    assert detail["trust_score_detail"] is not None

def test_document_upload_limit_and_format_validation():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "darshak@gmail.com",
        "password": "123321123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/v1/cases", json={
        "title": "Limit & Format Test Case",
        "ai_recommendation": "APPROVE LOAN",
        "case_type": "LOAN_APPLICATION"
    }, headers=headers)
    assert create_res.status_code in [200, 201]
    case_id = create_res.json()["id"]

    # Reject unsupported format (.exe)
    invalid_file = [("files", ("malware.exe", io.BytesIO(b"MZ executable content"), "application/octet-stream"))]
    inv_res = client.post(
        f"/api/v1/cases/{case_id}/documents",
        files=invalid_file,
        headers=headers
    )
    assert inv_res.status_code in [400, 422]
    assert "Unsupported file format" in inv_res.json()["error"]["message"]

    # Reject > 5 files
    too_many_files = [
        ("files", (f"doc_{i}.pdf", io.BytesIO(b"%PDF-1.4 file content"), "application/pdf"))
        for i in range(6)
    ]
    limit_res = client.post(
        f"/api/v1/cases/{case_id}/documents",
        files=too_many_files,
        headers=headers
    )
    assert limit_res.status_code in [400, 422]
    assert "Maximum" in limit_res.json()["error"]["message"] and "5" in limit_res.json()["error"]["message"]
