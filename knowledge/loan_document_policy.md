# Loan Underwriting & Evidence Verification Policy

**Policy Reference:** LOAN-DOC-PROTOTYPE-2026-V1  
**Category:** Lending Operations  
**Status:** Demonstration Standard (Synthetic Prototype)

---

## 1. Credit & Loan Application Evidence Rules
1. Automated AI credit scoring engines provide preliminary recommendations (e.g., `APPROVE LOAN`, `REJECT LOAN`).
2. The LaxmanRekha Verification Layer serves as the compliance guardrail before loan disbursement or sanction generation.
3. Proof of Identity and Proof of Income are mandatory documents for personal and business credit facilities.

## 2. Policy Alignment
- If income stated in the application diverges by more than 20% from extracted bank statement deposits without reasonable explanation, the case is assigned a `MEDIUM RISK` status for manual underwriting.
- If the AI recommendation is `APPROVE LOAN` but the LaxmanRekha Trust Score is below **60/100**, the decision is marked **NOT SUPPORTED BY EVIDENCE** and straight-through disbursement is blocked.
