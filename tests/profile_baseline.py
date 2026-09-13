import time
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_benchmarks():
    print("=== LAXMANREKHA AI PERFORMANCE OPTIMIZATION BENCHMARK ===")
    
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Login
        t0 = time.perf_counter()
        login_res = client.post("/auth/login", json={"email": "darshak@gmail.com", "password": "123321123"})
        t_login = (time.perf_counter() - t0) * 1000
        print(f"1. POST /auth/login: {t_login:.1f}ms (status={login_res.status_code})")
        
        token = login_res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Analytics Summary (Dashboard) - First call (DB single-query aggregation)
        t0 = time.perf_counter()
        summary_res1 = client.get("/analytics/summary", headers=headers)
        t_summary1 = (time.perf_counter() - t0) * 1000
        print(f"2a. GET /analytics/summary (Uncached DB Aggregation): {t_summary1:.1f}ms (status={summary_res1.status_code})")

        # 2b. Analytics Summary - Second call (Redis Cache tier)
        t0 = time.perf_counter()
        summary_res2 = client.get("/analytics/summary", headers=headers)
        t_summary2 = (time.perf_counter() - t0) * 1000
        print(f"2b. GET /analytics/summary (Redis Cached): {t_summary2:.1f}ms (status={summary_res2.status_code})")
        
        # 3. Cases List (Indexed ORDER BY)
        t0 = time.perf_counter()
        cases_res = client.get("/cases?limit=50", headers=headers)
        t_cases = (time.perf_counter() - t0) * 1000
        cases_data = cases_res.json()
        print(f"3. GET /cases?limit=50: {t_cases:.1f}ms (count={len(cases_data)})")
        
        # 4. Case Detail (selectinload batch)
        case_id = cases_data[0]["id"] if cases_data else None
        if case_id:
            t0 = time.perf_counter()
            detail_res = client.get(f"/cases/{case_id}", headers=headers)
            t_detail = (time.perf_counter() - t0) * 1000
            print(f"4. GET /cases/{case_id} (selectinload): {t_detail:.1f}ms (status={detail_res.status_code})")
            
        # 5. Reviews List
        t0 = time.perf_counter()
        reviews_res = client.get("/reviews/pending", headers=headers)
        t_reviews = (time.perf_counter() - t0) * 1000
        print(f"5. GET /reviews/pending: {t_reviews:.1f}ms (status={reviews_res.status_code})")
        
        # 6. Audit Logs (joinedload eager relation)
        t0 = time.perf_counter()
        audit_res = client.get("/audit?limit=50", headers=headers)
        t_audit = (time.perf_counter() - t0) * 1000
        print(f"6. GET /audit?limit=50 (joinedload): {t_audit:.1f}ms (status={audit_res.status_code})")

if __name__ == "__main__":
    run_benchmarks()

if __name__ == "__main__":
    run_benchmarks()
