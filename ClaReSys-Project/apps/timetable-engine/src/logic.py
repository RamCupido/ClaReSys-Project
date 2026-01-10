from datetime import datetime, timezone
from dateutil import parser
from typing import List, Tuple

def parse_iso_to_utc(date_str: str) -> datetime:
    """
    Always returns a timezone-aware datetime in UTC.
    Accepts:
      - 2026-01-10T10:00:00
      - 2026-01-10T10:00:00Z
      - 2026-01-10T10:00:00-05:00
    """
    s = date_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        # If naive, assume UTC (or your local timezone; UTC is safer)
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def check_overlap(candidate_start: str, candidate_end: str, existing_intervals: List[Tuple[str, str]]) -> bool:
    """
    Algoritmo de intersección de intervalos.
    Retorna True si hay conflicto (solapamiento).
    """
    cand_start = parse_iso_to_utc(candidate_start)
    cand_end = parse_iso_to_utc(candidate_end)

    for exist_start_str, exist_end_str in existing_intervals:
        exist_start = parse_iso_to_utc(exist_start_str)
        exist_end = parse_iso_to_utc(exist_end_str)

        # Overlapping formula: Max(Starts) < Min(Ends)
        # If the start of the candidate is before the end of the existing AND
        # the start of the existing is before the end of the candidate.
        if max(cand_start, exist_start) < min(cand_end, exist_end):
            return True

    return False