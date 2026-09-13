from typing import Dict, Any, Optional

class TransactionService:
    @staticmethod
    def assess_transaction_safety(
        amount: Optional[float] = None,
        currency: str = "INR",
        transaction_type: Optional[str] = "LOAN_DISBURSEMENT",
        count_24h: int = 1,
        is_new_device: bool = False,
        is_unusual_location: bool = False
    ) -> Dict[str, Any]:
        """
        Deterministic Transaction Safety Engine.
        Returns transaction_risk_score (0-100, 100=Safest) and flagged factors.
        """
        if amount is None:
            return {
                "transaction_risk_score": 85.0,
                "status": "NOT_ASSESSED",
                "summary": "Transaction parameters not provided for this case. Neutral safety baseline applied.",
                "flags": []
            }

        score = 100.0
        flags = []

        # 1. Amount threshold rules (INR demonstration baselines)
        if amount > 5000000.0:
            score -= 30.0
            flags.append(f"High-value transaction: {currency} {amount:,.2f} exceeds standard automated approval threshold.")
        elif amount > 1500000.0:
            score -= 15.0
            flags.append(f"Elevated transaction value: {currency} {amount:,.2f}.")
        else:
            flags.append(f"Standard transaction value: {currency} {amount:,.2f}.")

        # 2. Velocity in 24h
        if count_24h > 7:
            score -= 25.0
            flags.append(f"High transaction frequency: {count_24h} transactions in the last 24 hours.")
        elif count_24h >= 4:
            score -= 10.0
            flags.append(f"Moderate transaction velocity: {count_24h} transactions in 24 hours.")

        # 3. Device & Location anomalies
        if is_new_device:
            score -= 20.0
            flags.append("Unrecognized client device / browser fingerprint.")
        if is_unusual_location:
            score -= 25.0
            flags.append("Transaction initiated from an unusual geographic IP or location.")

        score = max(10.0, min(100.0, score))
        
        status = "LOW_RISK" if score >= 80.0 else ("MEDIUM_RISK" if score >= 60.0 else "HIGH_RISK")
        return {
            "transaction_risk_score": round(score, 1),
            "status": status,
            "summary": "Transaction parameters fall within safe bounds." if score >= 75.0 else f"Transaction anomalies detected ({len(flags)} risk signals).",
            "flags": flags
        }

transaction_service = TransactionService()
