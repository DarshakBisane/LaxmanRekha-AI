# Banking Prototype KYC & Customer Due Diligence Policy

**Policy Reference:** KYC-CDD-PROTOTYPE-2026-V1  
**Category:** Customer Due Diligence (CDD)  
**Status:** Demonstration Standard (Synthetic Prototype)

---

## 1. Objective and Scope
This policy establishes baseline verification requirements for customer onboarding and loan applicant identification within the synthetic demonstration environment. 

## 2. Mandatory Verification Baseline
1. Every applicant must submit a valid identification document bearing a unique synthetic identifier (e.g., `SYNTHxxxxX`).
2. The synthetic identifier must be verified deterministically against the Trusted Verification Registry.
3. If an identity cannot be resolved against the trusted registry (`UNKNOWN_IDENTITY`), the application must not proceed automatically and must be flagged as `HIGH RISK`.

## 3. Evidence Thresholds
- A minimum identity confidence score of **80%** is required for straight-through processing.
- Identity scores below 60% require escalation to a Senior Bank Officer or Human Reviewer for secondary verification.
- For high-value transactions or credit facilities, multi-document correlation (Identity + Proof of Income + Bank Statement) is mandatory.

## 4. Remediation and Escalation
When primary verification signals fail, the system must trigger an evidence checklist requiring:
- Secondary government-equivalent synthetic credential verification.
- Direct customer re-authentication or branch review.
