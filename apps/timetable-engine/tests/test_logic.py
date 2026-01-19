import pytest
from datetime import timezone

from logic import parse_iso_to_utc, check_overlap

# ----------------------------
# parse_iso_to_utc
# ----------------------------

@pytest.mark.parametrize(
    "date_str, expected_iso_utc",
    [
        # naive: assume UTC
        ("2026-01-10T10:00:00", "2026-01-10T10:00:00+00:00"),

        # Z: already UTC
        ("2026-01-10T10:00:00Z", "2026-01-10T10:00:00+00:00"),

        # offset -05:00 => UTC is 5 hours ahead
        ("2026-01-10T10:00:00-05:00", "2026-01-10T15:00:00+00:00"),
    ],
)
def test_parse_iso_to_utc_normalizes_to_utc(date_str, expected_iso_utc):
    dt = parse_iso_to_utc(date_str)

    assert dt.tzinfo is not None
    assert dt.tzinfo == timezone.utc
    assert dt.isoformat() == expected_iso_utc


# ----------------------------
# check_overlap
# ----------------------------

def test_check_overlap_returns_true_on_conflict():
    # 10-12 vs 11-13 => conflict
    candidate_start = "2025-01-01T10:00:00"
    candidate_end = "2025-01-01T12:00:00"
    existing = [("2025-01-01T11:00:00", "2025-01-01T13:00:00")]

    assert check_overlap(candidate_start, candidate_end, existing) is True


def test_check_overlap_returns_false_when_free():
    # 10-12 vs 08-09 => free
    candidate_start = "2025-01-01T10:00:00"
    candidate_end = "2025-01-01T12:00:00"
    existing = [("2025-01-01T08:00:00", "2025-01-01T09:00:00")]

    assert check_overlap(candidate_start, candidate_end, existing) is False


def test_check_overlap_exact_boundary_is_not_conflict():
    # 10-11 vs 11-12 => Don't conflict
    candidate_start = "2025-01-01T10:00:00"
    candidate_end = "2025-01-01T11:00:00"
    existing = [("2025-01-01T11:00:00", "2025-01-01T12:00:00")]

    assert check_overlap(candidate_start, candidate_end, existing) is False


def test_check_overlap_multiple_intervals_one_conflicts():
    # candidate 10-12 vs existing 07-08
    candidate_start = "2025-01-01T10:00:00"
    candidate_end = "2025-01-01T12:00:00"
    existing = [
        ("2025-01-01T07:00:00", "2025-01-01T08:00:00"),
        ("2025-01-01T11:30:00", "2025-01-01T13:00:00"),
    ]

    assert check_overlap(candidate_start, candidate_end, existing) is True


def test_check_overlap_with_timezones_equivalent_instants():
    # Candidate: 10:00-11:00 UTC
    candidate_start = "2025-01-01T10:00:00Z"
    candidate_end = "2025-01-01T11:00:00Z"

    # Existing: 05:30-06:30 -04:30 equals 10:00-11:00 UTC => conflict
    existing = [("2025-01-01T05:30:00-04:30", "2025-01-01T06:30:00-04:30")]

    assert check_overlap(candidate_start, candidate_end, existing) is True
