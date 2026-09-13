import os
import fitz # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

output_dir = os.path.dirname(__file__)

def create_pdf(filename: str, title: str, lines: list):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4
    
    # Draw header banner
    rect = fitz.Rect(40, 40, 555, 100)
    page.draw_rect(rect, color=(0.1, 0.2, 0.4), fill=(0.92, 0.94, 0.98))
    page.insert_text(fitz.Point(55, 68), "LAXMANREKHA AI — SYNTHETIC DEMONSTRATION RECORD", fontsize=11, color=(0.1, 0.2, 0.4))
    page.insert_text(fitz.Point(55, 88), "FOR PROTOTYPE EVALUATION ONLY — NOT A REAL GOVERNMENT DOCUMENT", fontsize=9, color=(0.7, 0.2, 0.2))

    # Title
    page.insert_text(fitz.Point(55, 140), title, fontsize=16, color=(0.08, 0.12, 0.25))
    
    # Body lines
    y = 180
    for label, val in lines:
        page.insert_text(fitz.Point(60, y), f"{label}:", fontsize=11, color=(0.3, 0.35, 0.45))
        page.insert_text(fitz.Point(220, y), str(val), fontsize=11, color=(0.05, 0.08, 0.15))
        page.draw_line(fitz.Point(60, y + 8), fitz.Point(535, y + 8), color=(0.85, 0.88, 0.92))
        y += 36

    # Footer
    page.insert_text(fitz.Point(55, 780), "Security Notice: Prototype synthetic data generated for R1-02 verification testing.", fontsize=9, color=(0.5, 0.55, 0.6))
    
    filepath = os.path.join(output_dir, filename)
    doc.save(filepath)
    doc.close()
    print(f"Generated {filepath}")

# 1. Identity Mismatch Document (Rahul Sharma with SYNTH1234A)
create_pdf(
    "demo_identity_mismatch.pdf",
    "SYNTHETIC IDENTITY CERTIFICATE",
    [
        ("Synthetic Identifier", "SYNTH1234A"),
        ("Applicant Full Name", "Rahul Sharma"),
        ("Date of Birth", "10/05/2002"),
        ("Gender", "Male"),
        ("Address", "Flat 402, Shiv Shanti Heights, Pune, Maharashtra"),
        ("Issuing Authority", "Synthetic Verification Authority (Demo)"),
        ("Issue Date", "15/01/2023")
    ]
)

# 2. Salary Slip (Rahul Sharma)
create_pdf(
    "demo_salary_slip.pdf",
    "APEX TECH SOLUTIONS — SALARY CERTIFICATE",
    [
        ("Employee Name", "Rahul Sharma"),
        ("Employee ID", "EMP-8842"),
        ("Designation", "Senior Associate Engineer"),
        ("Pay Period", "August 2026"),
        ("Monthly Gross Salary", "INR 65,000.00"),
        ("Net Pay Disbursed", "INR 58,400.00"),
        ("Disbursement Bank", "State Banking Corp")
    ]
)

# 3. Bank Statement with Conflict (Amit Patil)
create_pdf(
    "demo_bank_statement_conflict.pdf",
    "STATE BANKING CORP — ACCOUNT STATEMENT",
    [
        ("Primary Account Holder", "Amit Patil"),
        ("Account Number", "9876543210"),
        ("Account Type", "Savings Plus Account"),
        ("Statement Period", "01/08/2026 to 31/08/2026"),
        ("Monthly Salary Credit", "INR 65,000.00"),
        ("Average Monthly Balance", "INR 1,42,800.00")
    ]
)

# 4. Valid Identity Document (Amit Patil with SYNTH1234A)
create_pdf(
    "demo_valid_identity.pdf",
    "SYNTHETIC IDENTITY CERTIFICATE (VERIFIED RECORD)",
    [
        ("Synthetic Identifier", "SYNTH1234A"),
        ("Applicant Full Name", "Amit Patil"),
        ("Date of Birth", "10/05/2002"),
        ("Gender", "Male"),
        ("Address", "Flat 402, Shiv Shanti Heights, Pune, Maharashtra"),
        ("Status", "ACTIVE"),
        ("Issue Date", "15/01/2023")
    ]
)

# 5. Unknown Identity Document (SYNTH9999Z)
create_pdf(
    "demo_unknown_identity.pdf",
    "SYNTHETIC IDENTITY CERTIFICATE (UNREGISTERED)",
    [
        ("Synthetic Identifier", "SYNTH9999Z"),
        ("Applicant Full Name", "Sanjay Gupta"),
        ("Date of Birth", "15/08/1997"),
        ("Gender", "Male"),
        ("Address", "Sector 44, Gurugram, Haryana"),
        ("Status", "UNVERIFIED"),
        ("Issue Date", "01/06/2024")
    ]
)
