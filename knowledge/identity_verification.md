# Synthetic Identity Verification Standard

**Policy Reference:** ID-VERIF-PROTOTYPE-2026-V1  
**Category:** Identity Authentication  
**Status:** Demonstration Standard (Synthetic Prototype)

---

## 1. Multi-Field Matching Standard
Identity verification requires concurrent evaluation of four primary dimensions:
1. **Synthetic ID Match**: Exact alphanumeric match against the registered dataset.
2. **Full Name Match**: Normalized string match (case-insensitive, whitespace collapsed, token order checked).
3. **Date of Birth Match**: Standardized ISO-8601 (`YYYY-MM-DD`) format comparison.
4. **Account/Record Status**: Must be in active (`ACTIVE`) status in the registry.

## 2. Risk Classification Matrix
- **All 4 Fields Match**: Low Risk (Identity Verification Score: 95–100%).
- **ID & DOB Match, Name Mismatch**: High Risk (Score: 30–45%). Indicates potential impersonation or typographical conflict.
- **ID Matches, Status Inactive/Suspended**: High Risk (Score: 10–25%).
- **ID Not Found**: High Risk (Score: 0%).

## 3. Explainability Mandate
Any score reduction must generate an explicit explainability payload detailing the uploaded value, the expected registry value, and the specific field delta.
