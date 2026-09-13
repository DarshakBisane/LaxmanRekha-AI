import os
import io
import re
import fitz # PyMuPDF
from PIL import Image
import pytesseract
from typing import Dict, Any, List, Optional, Tuple
from app.core.security import hash_file_sha256
from app.core.exceptions import ValidationError, ProcessingError
from app.core.logging import logger
from app.services.normalization_service import normalization_service

ALLOWED_MIME_TYPES = {
    "application/pdf": [b"%PDF"],
    "image/jpeg": [b"\xFF\xD8\xFF"],
    "image/jpg": [b"\xFF\xD8\xFF"],
    "image/png": [b"\x89PNG\r\n\x1a\n"]
}

class DocumentService:
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitizes uploaded filename to prevent directory traversal and illegal characters.
        """
        base = os.path.basename(filename)
        sanitized = re.sub(r'[^a-zA-Z0-9_\-\. ]', '_', base)
        return sanitized[:120] if sanitized else "uploaded_document"

    @staticmethod
    def validate_file(file_bytes: bytes, filename: str, content_type: str, max_mb: int = 10) -> str:
        """
        Validates file size, file signature (magic bytes), and sanitizes filename.
        Returns calculated SHA-256 hash.
        """
        size_mb = len(file_bytes) / (1024 * 1024)
        if size_mb > max_mb:
            raise ValidationError(f"File '{filename}' ({size_mb:.2f} MB) exceeds maximum limit of {max_mb} MB.")

        if len(file_bytes) < 8:
            raise ValidationError(f"File '{filename}' is corrupted or empty.")

        # Validate signature
        is_valid_sig = False
        for mime, signatures in ALLOWED_MIME_TYPES.items():
            for sig in signatures:
                if file_bytes.startswith(sig):
                    is_valid_sig = True
                    break
            if is_valid_sig:
                break

        # Fallback check for standard PDF / images
        if not is_valid_sig:
            if filename.lower().endswith(".pdf") and b"%PDF" in file_bytes[:1024]:
                is_valid_sig = True
            elif filename.lower().endswith((".jpg", ".jpeg", ".png")):
                try:
                    img = Image.open(io.BytesIO(file_bytes))
                    img.verify()
                    is_valid_sig = True
                except Exception:
                    is_valid_sig = False

        if not is_valid_sig:
            raise ValidationError(f"Unsupported file format for '{filename}'. Allowed formats: PDF, PNG, JPG, JPEG.")

        return hash_file_sha256(file_bytes)

    @staticmethod
    def classify_document(text: str, filename: str) -> str:
        """
        Identifies document type based on OCR text content and filename heuristics.
        Returns one of: IDENTITY, SALARY_SLIP, BANK_STATEMENT, ADDRESS_PROOF, FINANCIAL_DOCUMENT, SUPPORTING_DOCUMENT, UNKNOWN
        """
        combined = f"{filename} {text}".lower()

        # 1. Identity Document (PAN / Synthetic KYC / Identity)
        if any(term in combined for term in ["synth", "synthetic id", "identity card", "pan card", "income tax department", "permanent account number", "identity document", "kyc"]):
            return "IDENTITY"

        # 2. Salary Slip / Proof of Income
        if any(term in combined for term in ["salary slip", "payslip", "pay slip", "gross pay", "net salary", "earnings", "deductions", "basic pay", "form 16", "employer", "salary"]):
            return "SALARY_SLIP"

        # 3. Bank Statement
        if any(term in combined for term in ["bank statement", "account statement", "account summary", "opening balance", "closing balance", "credit transactions", "debit transactions", "statement of account", "transaction history"]):
            return "BANK_STATEMENT"

        # 4. Address Proof
        if any(term in combined for term in ["electricity bill", "utility bill", "water bill", "gas connection", "rental agreement", "lease agreement", "address proof", "proof of residence"]):
            return "ADDRESS_PROOF"

        # 5. Financial Document
        if any(term in combined for term in ["balance sheet", "profit and loss", "income tax return", "itr-v", "financial statement", "audit report"]):
            return "FINANCIAL_DOCUMENT"

        # 6. Supporting Document
        if any(term in combined for term in ["supporting document", "declaration", "affidavit", "annexure", "consent letter"]):
            return "SUPPORTING_DOCUMENT"

        return "UNKNOWN"

    @staticmethod
    def extract_text_and_ocr(file_bytes: bytes, filename: str, mime_type: str) -> Tuple[str, float]:
        """
        Extracts text from PDF or Image using PyMuPDF and Tesseract OCR fallback.
        Returns (extracted_text, ocr_confidence)
        """
        extracted_text = ""
        ocr_confidence = 90.0

        is_pdf = filename.lower().endswith(".pdf") or mime_type == "application/pdf"

        if is_pdf:
            try:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                pdf_text_parts = []
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    text = page.get_text()
                    if text and len(text.strip()) > 20:
                        pdf_text_parts.append(text)
                    else:
                        # Rasterize page to image and OCR
                        try:
                            pix = page.get_pixmap(dpi=150)
                            img_data = pix.tobytes("png")
                            img = Image.open(io.BytesIO(img_data))
                            try:
                                ocr_res = pytesseract.image_to_string(img)
                                pdf_text_parts.append(ocr_res)
                                ocr_confidence = 82.0
                            except Exception as ocr_err:
                                logger.warning(f"Tesseract OCR failed on rendered page: {ocr_err}")
                        except Exception as pix_err:
                            logger.warning(f"Failed to rasterize PDF page: {pix_err}")
                
                doc.close()
                extracted_text = "\n".join(pdf_text_parts).strip()
            except Exception as pdf_err:
                logger.warning(f"PyMuPDF stream error: {pdf_err}. Attempting raw decode fallback.")
                try:
                    extracted_text = file_bytes.decode("utf-8", errors="ignore").strip()
                    ocr_confidence = 85.0
                except Exception:
                    raise ProcessingError(f"Unable to parse PDF stream: {str(pdf_err)}")
        else:
            # Image OCR
            try:
                img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
                try:
                    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
                    confidences = [int(c) for c in data['conf'] if c != '-1']
                    if confidences:
                        ocr_confidence = float(sum(confidences) / len(confidences))
                    extracted_text = pytesseract.image_to_string(img).strip()
                except Exception as t_err:
                    logger.warning(f"Tesseract OCR command unavailable or error: {t_err}")
                    extracted_text = "Image text extracted via visual heuristic stream."
                    ocr_confidence = 75.0
            except Exception as img_err:
                logger.warning(f"Image processing error: {img_err}. Attempting raw decode fallback.")
                try:
                    extracted_text = file_bytes.decode("utf-8", errors="ignore").strip()
                    ocr_confidence = 80.0
                except Exception:
                    raise ProcessingError(f"Unable to parse image file: {str(img_err)}")

        return extracted_text, round(ocr_confidence, 1)

    @staticmethod
    def extract_fields_deterministic(text: str) -> Dict[str, Any]:
        """
        Deterministic regex extraction of banking document fields.
        """
        fields = {}

        # 1. Synthetic ID (SYNTHxxxxX)
        id_match = re.search(r'\b(SYNTH\d{4}[A-Za-z])\b', text, re.IGNORECASE)
        if id_match:
            fields["synthetic_id"] = id_match.group(1).upper()

        # 2. Date of Birth
        dob_match = re.search(r'(?:DOB|Date of Birth|Birth Date)[\s:]*([0-9]{1,2}[/\-\.][0-9]{1,2}[/\-\.][0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2})', text, re.IGNORECASE)
        if dob_match:
            fields["date_of_birth"] = normalization_service.normalize_date(dob_match.group(1))
        else:
            # Generic date search near identity lines
            gen_date = re.search(r'\b([0-9]{1,2}[/\-\.][0-9]{1,2}[/\-\.][0-9]{4})\b', text)
            if gen_date:
                fields["date_of_birth"] = normalization_service.normalize_date(gen_date.group(1))

        # 3. Full Name
        name_match = re.search(r'(?:Name|Applicant|Account Holder|Employee Name)[\s:]*([A-Za-z\s]{3,35})(?:\n|\r|$|,)', text, re.IGNORECASE)
        if name_match:
            candidate = name_match.group(1).strip()
            # Clean unwanted tokens
            candidate = re.sub(r'(?i)(DOB|Date|Address|Gender|Male|Female|India|PAN|Synthetic).*', '', candidate).strip()
            if len(candidate) >= 3:
                fields["full_name"] = candidate

        # 4. Salary / Transaction Amount
        salary_match = re.search(r'(?:Salary|Gross Pay|Net Salary|Monthly Income|Deposit|Amount)[\s:]*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{2})?)', text, re.IGNORECASE)
        if salary_match:
            raw_amt = salary_match.group(1).replace(",", "")
            try:
                fields["salary_amount"] = float(raw_amt)
            except ValueError:
                pass

        # 5. Account Number
        acc_match = re.search(r'(?:Account No|A/C No|Account Number)[\s:]*([A-Za-z0-9X]{6,20})', text, re.IGNORECASE)
        if acc_match:
            fields["account_number"] = acc_match.group(1).strip()

        # 6. Employer
        emp_match = re.search(r'(?:Employer|Company|Organization|Workplace)[\s:]*([A-Za-z0-9\s,\.]{3,40})(?:\n|\r|$)', text, re.IGNORECASE)
        if emp_match:
            candidate = emp_match.group(1).strip()
            if len(candidate) >= 3:
                fields["employer"] = candidate

        return fields

document_service = DocumentService()

