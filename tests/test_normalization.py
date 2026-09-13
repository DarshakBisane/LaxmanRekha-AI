import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.normalization_service import normalization_service

def test_name_cleaning_and_token_reorder():
    name1 = "Amit Patil"
    name2 = "Patil Amit"
    is_match, score = normalization_service.compare_names(name1, name2)
    assert is_match is True
    assert score == 100.0

def test_name_mismatch():
    name1 = "Rahul Sharma"
    name2 = "Amit Patil"
    is_match, score = normalization_service.compare_names(name1, name2)
    assert is_match is False
    assert score < 50.0

def test_date_iso_normalization():
    assert normalization_service.normalize_date("10/05/2002") == "2002-05-10"
    assert normalization_service.normalize_date("2002-05-10") == "2002-05-10"
    assert normalization_service.normalize_date("10-05-2002") == "2002-05-10"

def test_synthetic_id_normalization():
    assert normalization_service.normalize_id("synth-1234-a") == "SYNTH1234A"
    assert normalization_service.normalize_id("  SYNTH 5678 B ") == "SYNTH5678B"
