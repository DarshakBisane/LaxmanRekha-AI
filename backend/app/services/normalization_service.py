import re
import datetime
from typing import Optional, Tuple
from rapidfuzz import fuzz

class NormalizationService:
    @staticmethod
    def normalize_name(name: Optional[str]) -> str:
        if not name:
            return ""
        # Lowercase and strip
        cleaned = name.lower().strip()
        # Remove titles / honorifics
        cleaned = re.sub(r'^(mr|mrs|ms|dr|shri|smt)\.?\s+', '', cleaned)
        # Replace punctuation with space
        cleaned = re.sub(r'[^a-z0-9\s]', ' ', cleaned)
        # Collapse multiple spaces
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    @staticmethod
    def compare_names(name1: Optional[str], name2: Optional[str]) -> Tuple[bool, float]:
        """
        Returns (is_match, similarity_score_0_to_100)
        """
        n1 = NormalizationService.normalize_name(name1)
        n2 = NormalizationService.normalize_name(name2)
        if not n1 or not n2:
            return False, 0.0
        
        if n1 == n2:
            return True, 100.0

        # Token sort ratio handles rearranged words (e.g. "Patil Amit" vs "Amit Patil")
        score = fuzz.token_sort_ratio(n1, n2)
        is_match = score >= 88.0
        return is_match, float(score)

    @staticmethod
    def normalize_date(date_str: Optional[str]) -> Optional[str]:
        """
        Normalizes various date formats (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, etc.) to ISO YYYY-MM-DD
        """
        if not date_str:
            return None
        cleaned = date_str.strip()
        
        patterns = [
            (r'^(\d{4})-(\d{1,2})-(\d{1,2})$', '%Y-%m-%d'),
            (r'^(\d{1,2})/(\d{1,2})/(\d{4})$', '%d/%m/%Y'),
            (r'^(\d{1,2})-(\d{1,2})-(\d{4})$', '%d-%m-%Y'),
            (r'^(\d{1,2})\.(\d{1,2})\.(\d{4})$', '%d.%m.%Y'),
        ]

        for regex, date_format in patterns:
            match = re.match(regex, cleaned)
            if match:
                try:
                    dt = datetime.datetime.strptime(cleaned, date_format)
                    return dt.strftime("%Y-%m-%d")
                except ValueError:
                    continue

        # Try dateutil or standard strptime fallback
        for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d %b %Y", "%d %B %Y", "%b %d, %Y"]:
            try:
                dt = datetime.datetime.strptime(cleaned, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                pass
        return cleaned

    @staticmethod
    def normalize_id(identifier: Optional[str]) -> str:
        if not identifier:
            return ""
        # Uppercase, remove spaces and hyphens
        return re.sub(r'[^A-Za-z0-9]', '', identifier).upper()

normalization_service = NormalizationService()
