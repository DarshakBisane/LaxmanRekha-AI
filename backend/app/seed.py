import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import (
    User, Case, Document, ExtractedField, VerificationResult, 
    TrustScore, Review, AuditLog, TrustedRegistryRecord, PolicyDocument
)
from app.core.logging import logger
from app.core.security import hash_password
from app.services.audit_service import audit_service

def seed_database():
    db: Session = SessionLocal()
    try:
        logger.info("Starting database seeding for LaxmanRekha AI...")

        # 1. Seed Synthetic Registry Records
        registry_data = [
            {
                "synthetic_id": "SYNTH1234A",
                "name": "Amit Patil",
                "date_of_birth": "2002-05-10",
                "status": "ACTIVE",
                "address": "Flat 402, Shiv Shanti Heights, Pune, Maharashtra 411038"
            },
            {
                "synthetic_id": "SYNTH5678B",
                "name": "Neha Kulkarni",
                "date_of_birth": "2001-11-21",
                "status": "ACTIVE",
                "address": "12/B Nilgiri Enclave, Thane West, Mumbai, Maharashtra 400602"
            },
            {
                "synthetic_id": "SYNTH2468C",
                "name": "Rohit Jadhav",
                "date_of_birth": "2000-08-03",
                "status": "ACTIVE",
                "address": "74 Galaxy Avenue, Baner, Pune, Maharashtra 411045"
            },
            {
                "synthetic_id": "SYNTH1357D",
                "name": "Priya Deshmukh",
                "date_of_birth": "2002-01-17",
                "status": "ACTIVE",
                "address": "804 Emerald Towers, Indiranagar, Bengaluru, Karnataka 560038"
            },
            {
                "synthetic_id": "SYNTH9012E",
                "name": "Rajesh Verma",
                "date_of_birth": "1998-12-05",
                "status": "INACTIVE",
                "address": "A-102 Sector 62, Noida, Uttar Pradesh 201301"
            },
            {
                "synthetic_id": "SYNTH3344F",
                "name": "Sneha Kulkarni",
                "date_of_birth": "1999-04-14",
                "status": "SUSPENDED",
                "address": "Plot 19, Koregaon Park, Pune, Maharashtra 411001"
            },
            {
                "synthetic_id": "SYNTH7788G",
                "name": "Vikram Joshi",
                "date_of_birth": "1995-09-30",
                "status": "ACTIVE",
                "address": "55 Marine Lines, South Mumbai, Maharashtra 400020"
            }
        ]

        for reg in registry_data:
            existing = db.query(TrustedRegistryRecord).filter(
                TrustedRegistryRecord.synthetic_id == reg["synthetic_id"]
            ).first()
            if not existing:
                record = TrustedRegistryRecord(**reg)
                db.add(record)
        db.commit()
        logger.info(f"Seeded {len(registry_data)} synthetic registry records.")

        # 2. Seed Default Bank Officer Account
        # Development/Demo credential - must be replaced before any real production deployment
        demo_officer_data = {
            "email": "darshak@gmail.com",
            "full_name": "Darshak K. Bisane",
            "role": "bank_officer",
            "password_hash": hash_password("123321123"),
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=DarshakBisane",
            "is_active": True
        }

        officer_user = db.query(User).filter(User.email == demo_officer_data["email"]).first()
        if not officer_user:
            officer_user = User(**demo_officer_data)
            db.add(officer_user)
            db.commit()
            db.refresh(officer_user)
            logger.info("Seeded demo bank officer: darshak@gmail.com")
        else:
            officer_user.full_name = demo_officer_data["full_name"]
            officer_user.password_hash = demo_officer_data["password_hash"]
            officer_user.role = "bank_officer"
            officer_user.is_active = True
            db.commit()
            db.refresh(officer_user)
            logger.info("Updated demo bank officer credentials.")

        # Additional review/audit demo accounts with hashed passwords
        additional_users = [
            {
                "email": "reviewer@laxmanrekha.ai",
                "full_name": "Ananya Sen (Senior Reviewer)",
                "role": "reviewer",
                "password_hash": hash_password("123321123"),
                "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=AnanyaSen",
                "is_active": True
            },
            {
                "email": "admin@laxmanrekha.ai",
                "full_name": "System Administrator",
                "role": "admin",
                "password_hash": hash_password("123321123"),
                "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=AdminLaxman",
                "is_active": True
            }
        ]

        for u in additional_users:
            ex_u = db.query(User).filter(User.email == u["email"]).first()
            if not ex_u:
                new_u = User(**u)
                db.add(new_u)
                db.commit()
            else:
                if not ex_u.password_hash:
                    ex_u.password_hash = u["password_hash"]
                    db.commit()


        # 3. Seed Signature Demo Case DEMO-001 (Name mismatch & Cross-doc conflict)
        demo_1 = db.query(Case).filter(Case.case_number == "DEMO-001").first()
        if not demo_1:
            demo_1 = Case(
                case_number="DEMO-001",
                created_by=officer_user.id,
                title="Personal Credit Line — Rs. 4,50,000",
                description="AI-assisted credit application for prime customer. Upstream model recommended straight-through loan approval.",
                ai_recommendation="APPROVE LOAN",
                case_type="LOAN_APPLICATION",
                status="PENDING_REVIEW",
                trust_score=38.0,
                risk_level="HIGH_RISK",
                transaction_amount=450000.0,
                transaction_currency="INR",
                transaction_type="LOAN_DISBURSEMENT",
                transaction_count_24h=1,
                is_new_device=False,
                is_unusual_location=False
            )
            db.add(demo_1)
            db.commit()
            db.refresh(demo_1)

            # Documents
            doc_id = Document(
                case_id=demo_1.id,
                document_type="IDENTITY",
                original_filename="synthetic_identity_card.pdf",
                mime_type="application/pdf",
                file_size=248000,
                sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                processing_status="EXTRACTED",
                ocr_confidence=91.5,
                extracted_text_preview="Synthetic Identity Document: SYNTH1234A. Name: Rahul Sharma. DOB: 10/05/2002."
            )
            doc_salary = Document(
                case_id=demo_1.id,
                document_type="SALARY_SLIP",
                original_filename="synthetic_salary_certificate.pdf",
                mime_type="application/pdf",
                file_size=186000,
                sha256_hash="9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                processing_status="EXTRACTED",
                ocr_confidence=88.0,
                extracted_text_preview="Apex Tech Solutions Pay Slip. Employee: Rahul Sharma. Gross Salary: INR 65,000."
            )
            doc_bank = Document(
                case_id=demo_1.id,
                document_type="BANK_STATEMENT",
                original_filename="synthetic_bank_statement.pdf",
                mime_type="application/pdf",
                file_size=312000,
                sha256_hash="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
                processing_status="EXTRACTED",
                ocr_confidence=86.5,
                extracted_text_preview="State Banking Statement. Account Holder: Amit Patil. A/C No: XXXX9876. Salary Credit: 65,000."
            )
            db.add_all([doc_id, doc_salary, doc_bank])
            db.commit()

            # Extracted fields
            f1 = ExtractedField(document_id=doc_id.id, case_id=demo_1.id, field_name="synthetic_id", field_value="SYNTH1234A", normalized_value="synth1234a", confidence=0.98, source="OCR_STRUCTURED")
            f2 = ExtractedField(document_id=doc_id.id, case_id=demo_1.id, field_name="full_name", field_value="Rahul Sharma", normalized_value="rahul sharma", confidence=0.94, source="OCR_STRUCTURED")
            f3 = ExtractedField(document_id=doc_id.id, case_id=demo_1.id, field_name="date_of_birth", field_value="2002-05-10", normalized_value="2002-05-10", confidence=0.96, source="OCR_STRUCTURED")
            f4 = ExtractedField(document_id=doc_salary.id, case_id=demo_1.id, field_name="full_name", field_value="Rahul Sharma", normalized_value="rahul sharma", confidence=0.92, source="OCR_STRUCTURED")
            f5 = ExtractedField(document_id=doc_bank.id, case_id=demo_1.id, field_name="full_name", field_value="Amit Patil", normalized_value="amit patil", confidence=0.95, source="OCR_STRUCTURED")
            db.add_all([f1, f2, f3, f4, f5])
            db.commit()

            # Verification Results
            v1 = VerificationResult(
                case_id=demo_1.id,
                check_type="IDENTITY",
                status="MISMATCH",
                score=30.0,
                details={
                    "summary": "Identity mismatch detected: submitted name 'Rahul Sharma' does not match registered name 'Amit Patil' for credential SYNTH1234A.",
                    "diffs": [
                        {"field_name": "Synthetic ID", "uploaded_value": "SYNTH1234A", "trusted_value": "SYNTH1234A", "status": "MATCH"},
                        {"field_name": "Full Name", "uploaded_value": "Rahul Sharma", "trusted_value": "Amit Patil", "status": "MISMATCH"},
                        {"field_name": "Date of Birth", "uploaded_value": "2002-05-10", "trusted_value": "2002-05-10", "status": "MATCH"},
                        {"field_name": "Registry Status", "uploaded_value": "—", "trusted_value": "ACTIVE", "status": "VERIFIED"}
                    ]
                }
            )
            v2 = VerificationResult(
                case_id=demo_1.id,
                check_type="SOURCE",
                status="FAIL",
                score=25.0,
                details={"found": True, "record": {"synthetic_id": "SYNTH1234A", "name": "Amit Patil"}}
            )
            v3 = VerificationResult(
                case_id=demo_1.id,
                check_type="CROSS_DOCUMENT",
                status="FAIL",
                score=25.0,
                details={
                    "summary": "Severe cross-document name conflict between submitted salary slip and bank statement.",
                    "conflicts": [
                        {"field_name": "Applicant Name", "document_a": "IDENTITY (synthetic_identity_card.pdf)", "value_a": "Rahul Sharma", "document_b": "BANK_STATEMENT (synthetic_bank_statement.pdf)", "value_b": "Amit Patil", "status": "CONFLICT"}
                    ]
                }
            )
            v4 = VerificationResult(
                case_id=demo_1.id,
                check_type="DOCUMENT_INTEGRITY",
                status="WARNING",
                score=55.0,
                details={"summary": "Possible manipulation indicators: metadata stream stripped and font layer mismatch detected across instruments."}
            )
            v5 = VerificationResult(
                case_id=demo_1.id,
                check_type="TRANSACTION",
                status="LOW_RISK",
                score=90.0,
                details={"flags": ["Standard loan amount (Rs. 4,50,000). Low velocity."], "summary": "Transaction parameters within baseline."}
            )
            v6 = VerificationResult(
                case_id=demo_1.id,
                check_type="POLICY",
                status="RETRIEVED",
                score=85.0,
                details={
                    "snippets": [
                        {
                            "filename": "mismatch_policy.md",
                            "section": "Decision Routing Rule",
                            "guidance": "Under prototype policy guidelines, human verification is strictly required for unresolved identity or cross-document account conflicts. Straight-through approval is prohibited.",
                            "relevance_score": 0.94
                        }
                    ]
                }
            )
            db.add_all([v1, v2, v3, v4, v5, v6])

            # TrustScore record (38/100 HIGH RISK)
            ts = TrustScore(
                case_id=demo_1.id,
                identity_score=30.0,
                document_integrity_score=55.0,
                field_consistency_score=25.0,
                ocr_confidence_score=88.0,
                source_verification_score=25.0,
                transaction_risk_score=90.0,
                final_score=38.0,
                risk_level="HIGH_RISK",
                explanation=(
                    "The upstream AI recommendation 'APPROVE LOAN' is NOT supported by the verified evidence. "
                    "While synthetic ID SYNTH1234A exists, the registered name is 'Amit Patil' whereas 'Rahul Sharma' was submitted. "
                    "Additionally, the bank statement contradicts the salary slip. Under prototype compliance policy, straight-through approval is blocked and human escalation is mandatory."
                ),
                ai_recommendation_supported=False
            )
            db.add(ts)
            db.commit()

            audit_service.log_event(
                db=db,
                action="CASE_CREATED",
                entity_type="Case",
                user_id=officer_user.id,
                case_id=demo_1.id,
                entity_id=demo_1.id,
                metadata={"case_number": "DEMO-001", "trust_score": 38.0, "risk_level": "HIGH_RISK"}
            )
            logger.info("Seeded signature case DEMO-001 successfully.")

        # 4. Seed Valid Demo Case DEMO-002 (Low Risk 94/100)
        demo_2 = db.query(Case).filter(Case.case_number == "DEMO-002").first()
        if not demo_2:
            demo_2 = Case(
                case_number="DEMO-002",
                created_by=officer_user.id,
                title="SME Working Capital Facility — Rs. 12,00,000",
                description="Verified SME borrower application with consistent synthetic identity and income documentation.",
                ai_recommendation="APPROVE LOAN",
                case_type="LOAN_APPLICATION",
                status="APPROVED",
                trust_score=94.0,
                risk_level="LOW_RISK",
                transaction_amount=1200000.0,
                transaction_currency="INR",
                transaction_type="LOAN_DISBURSEMENT",
                transaction_count_24h=1,
                is_new_device=False,
                is_unusual_location=False,
                completed_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(demo_2)
            db.commit()
            db.refresh(demo_2)

            ts2 = TrustScore(
                case_id=demo_2.id,
                identity_score=98.0,
                document_integrity_score=92.0,
                field_consistency_score=95.0,
                ocr_confidence_score=94.0,
                source_verification_score=95.0,
                transaction_risk_score=88.0,
                final_score=94.0,
                risk_level="LOW_RISK",
                explanation="The AI recommendation 'APPROVE LOAN' is fully supported by multi-source evidence. Identity, registry record, and cross-document fields correlate with zero discrepancies.",
                ai_recommendation_supported=True
            )
            db.add(ts2)
            db.commit()

        logger.info("Database seeding completed successfully!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
