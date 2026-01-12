import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.abspath(os.path.join(current_dir, '..'))

if src_path not in sys.path:
    sys.path.insert(0, src_path)

from logic import check_overlap

def test_check_overlap_returns_true_on_conflict():
    # Case: Conflicto (10-12 vs 11-13)
    candidate_start = "2025-01-01T10:00:00"
    candidate_end = "2025-01-01T12:00:00"
    
    existing = [
        ("2025-01-01T11:00:00", "2025-01-01T13:00:00")
    ]
    
    assert check_overlap(candidate_start, candidate_end, existing) is True

def test_check_overlap_returns_false_when_free():
    # Case: No conflict (10-12 vs 08-09)
    candidate_start = "2025-01-01T10:00:00"
    candidate_end = "2025-01-01T12:00:00"
    
    existing = [
        ("2025-01-01T08:00:00", "2025-01-01T09:00:00")
    ]
    
    assert check_overlap(candidate_start, candidate_end, existing) is False

def test_check_overlap_exact_boundary():
    # Case: Ends exactly when the other starts (No conflict usually)
    # 10:00-11:00 vs 11:00-12:00
    candidate_start = "2025-01-01T10:00:00"
    candidate_end = "2025-01-01T11:00:00"
    
    existing = [
        ("2025-01-01T11:00:00", "2025-01-01T12:00:00")
    ]
    
    assert check_overlap(candidate_start, candidate_end, existing) is False