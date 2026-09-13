# Discrepancy & Cross-Document Mismatch Policy

**Policy Reference:** MISMATCH-ESC-PROTOTYPE-2026-V1  
**Category:** Evidence Consistency & Remediation  
**Status:** Demonstration Standard (Synthetic Prototype)

---

## 1. Cross-Document Consistency Rule
When multiple documents (e.g. Identity Card, Salary Certificate, Bank Statement) are submitted for a single decision:
1. The **Primary Account Holder Name** must resolve to the same natural individual across all submitted instruments.
2. Any discrepancy across documents (e.g., Identity = "Rahul Sharma", Salary Slip = "Rahul Sharma", Bank Statement = "Amit Patil") is classified as a **Severe Cross-Document Conflict**.

## 2. Decision Routing Rule
- **Zero Mismatches**: Eligible for automated straight-through processing if all other verification scores meet policy thresholds.
- **Single Minor Typo (Fuzzy similarity > 90%)**: Eligible for `MEDIUM RISK` route with secondary verification.
- **Unresolved Identity or Account Conflict**: Under prototype policy guidelines, **Human Verification is Strictly Required** before any banking action can be authorized. Straight-through approval is prohibited.

## 3. Override Safeguards
An AI recommendation (e.g. "APPROVE LOAN") cannot override an unresolved cross-document or trusted registry mismatch. The deterministic Trust Layer must downgrade the decision to `PENDING_REVIEW` or `REJECTED`.
