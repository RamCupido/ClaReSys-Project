from dateutil import parser
from typing import List, Tuple

def parse_iso(date_str: str):
    return parser.isoparse(date_str)

def check_overlap(candidate_start: str, candidate_end: str, existing_intervals: List[Tuple[str, str]]) -> bool:
    """
    Algoritmo de intersección de intervalos.
    Retorna True si hay conflicto (solapamiento).
    """
    cand_start = parse_iso(candidate_start)
    cand_end = parse_iso(candidate_end)

    for exist_start_str, exist_end_str in existing_intervals:
        exist_start = parse_iso(exist_start_str)
        exist_end = parse_iso(exist_end_str)

        # Fórmula de solapamiento: Max(Starts) < Min(Ends)
        # Si el inicio del candidato es antes del fin del existente Y 
        # el inicio del existente es antes del fin del candidato.
        if max(cand_start, exist_start) < min(cand_end, exist_end):
            return True  # ¡Conflicto encontrado!

    return False