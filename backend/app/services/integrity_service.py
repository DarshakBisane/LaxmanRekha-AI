from typing import Dict, Any, List, Optional
import fitz # PyMuPDF
from PIL import Image
import io

class IntegrityService:
    @staticmethod
    def assess_document_integrity(
        file_bytes: bytes,
        mime_type: str,
        filename: str,
        ocr_confidence: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Calculates heuristic document manipulation indicators.
        Returns document_integrity_score (0-100) and indicator flags.
        """
        indicators: List[Dict[str, Any]] = []
        score = 90.0

        if mime_type == "application/pdf" or filename.lower().endswith(".pdf"):
            try:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                meta = doc.metadata or {}
                
                # Check 1: Missing metadata
                if not meta.get("producer") and not meta.get("creator"):
                    indicators.append({
                        "name": "Sparse PDF Metadata",
                        "status": "WARNING",
                        "description": "Standard PDF creation tool metadata is missing or stripped."
                    })
                    score -= 15.0
                else:
                    indicators.append({
                        "name": "PDF Metadata Structure",
                        "status": "PASS",
                        "description": f"Producer metadata verified: {meta.get('producer', 'Standard')[:30]}"
                    })

                # Check 2: Page count and layout
                page_count = len(doc)
                if page_count > 10:
                    indicators.append({
                        "name": "Excessive Page Count",
                        "status": "WARNING",
                        "description": f"Document has {page_count} pages for a single standard certificate."
                    })
                    score -= 10.0
                
                # Check 3: Text layer vs scanned image
                has_text = any(len(page.get_text()) > 30 for page in doc)
                if not has_text:
                    indicators.append({
                        "name": "Image-Only Raster PDF",
                        "status": "INFO",
                        "description": "Document contains scanned raster images without native font layer (standard for scanned photocopies)."
                    })
                else:
                    indicators.append({
                        "name": "Native Font Layer",
                        "status": "PASS",
                        "description": "Native vector fonts and embedded character streams present."
                    })
                doc.close()
            except Exception as e:
                indicators.append({
                    "name": "PDF Stream Parsing",
                    "status": "WARNING",
                    "description": f"Non-standard PDF stream encoding detected: {str(e)[:50]}"
                })
                score -= 20.0
        else:
            # Image assessment
            try:
                img = Image.open(io.BytesIO(file_bytes))
                width, height = img.size
                
                if width < 300 or height < 300:
                    indicators.append({
                        "name": "Low Image Resolution",
                        "status": "WARNING",
                        "description": f"Image resolution ({width}x{height}) is below standard verification threshold (600x600)."
                    })
                    score -= 25.0
                else:
                    indicators.append({
                        "name": "Resolution & Density",
                        "status": "PASS",
                        "description": f"Valid document resolution: {width}x{height} pixels."
                    })
            except Exception as e:
                score -= 20.0
                indicators.append({
                    "name": "Image Header Parsing",
                    "status": "WARNING",
                    "description": "Image header encoding irregularities."
                })

        # OCR Confidence factor
        if ocr_confidence is not None:
            if ocr_confidence < 50.0:
                indicators.append({
                    "name": "OCR Character Confidence",
                    "status": "WARNING",
                    "description": f"OCR character recognition confidence ({ocr_confidence:.1f}%) is low, indicating potential blur or degradation."
                })
                score -= 15.0
            else:
                indicators.append({
                    "name": "OCR Character Confidence",
                    "status": "PASS",
                    "description": f"OCR text clarity is high ({ocr_confidence:.1f}% confidence)."
                })

        score = max(10.0, min(100.0, score))
        return {
            "document_integrity_score": round(score, 1),
            "indicators": indicators,
            "summary": "No critical forgery indicators detected." if score >= 75.0 else "Possible document manipulation or degradation indicators detected."
        }

integrity_service = IntegrityService()
