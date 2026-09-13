import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "LaxmanRekha AI"
    assert "tagline" in data

def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data["components"]

def test_bank_officer_login_flow():
    res = client.post("/api/v1/auth/login", json={"email": "darshak@gmail.com", "password": "123321123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "darshak@gmail.com"
    assert data["user"]["role"] == "bank_officer"
    assert "csrf_token" in data

def test_bank_officer_invalid_login():
    res = client.post("/api/v1/auth/login", json={"email": "darshak@gmail.com", "password": "wrongpassword"})
    assert res.status_code == 401
    data = res.json()
    assert "error" in data

def test_cases_list_with_auth():
    # Login first
    login_res = client.post("/api/v1/auth/login", json={"email": "darshak@gmail.com", "password": "123321123"})
    token = login_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    cases_res = client.get("/api/v1/cases", headers=headers)
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert isinstance(cases, list)
    assert len(cases) >= 1
    assert any(c["case_number"] == "DEMO-001" for c in cases)

def test_analytics_summary():
    login_res = client.post("/api/v1/auth/login", json={"email": "darshak@gmail.com", "password": "123321123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/analytics/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_cases" in data
    assert data["total_cases"] >= 1
    assert "risk_distribution" in data

