import logging
import re
import sys
from typing import Any, Dict

# Patterns to mask from logs
SECRET_PATTERNS = [
    re.compile(r'(?i)(password|secret|token|api_key|key|authorization|bearer)\s*[:=]\s*["\']?([^"\'\s]+)["\']?'),
    re.compile(r'AQ\.[A-Za-z0-9_\-]+'), # Gemini API keys
    re.compile(r'GOCSPX-[A-Za-z0-9_\-]+'), # Google OAuth secrets
    re.compile(r'postgresql:\/\/[^@]+@'), # DB connection strings with passwords
]

class SanitizingFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        sanitized = original
        for pattern in SECRET_PATTERNS:
            try:
                sanitized = pattern.sub(r'[REDACTED]', sanitized)
            except Exception:
                pass
        return sanitized

def setup_logger(name: str = "laxmanrekha") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = SanitizingFormatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False
    return logger

logger = setup_logger()
