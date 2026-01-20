from typing import Any, Optional
import httpx

from src.config.config import (
    BOOKING_QUERY_BASE_URL,
    CLASSROOM_SERVICE_BASE_URL,
    MAINTENANCE_SERVICE_BASE_URL,
    REQUEST_TIMEOUT_SECONDS,
)

class UpstreamError(RuntimeError):
    pass

async def _get_json(url: str, headers: dict[str, str] | None = None) -> Any:
    timeout = httpx.Timeout(REQUEST_TIMEOUT_SECONDS)
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.get(url, headers=headers)
        if r.status_code >= 400:
            raise UpstreamError(f"Upstream error {r.status_code} from {url}: {r.text}")
        return r.json()

async def fetch_classroom(classroom_id: str, auth_header: Optional[str]) -> dict:
    headers = {"Authorization": auth_header} if auth_header else None
    url = f"{CLASSROOM_SERVICE_BASE_URL}/api/v1/classrooms/{classroom_id}"
    return await _get_json(url, headers=headers)

async def fetch_bookings_for_classroom(classroom_id: str, auth_header: Optional[str], status_filter: str | None = None) -> dict:
    headers = {"Authorization": auth_header} if auth_header else None
    qs = f"classroom_id={classroom_id}&limit=200&offset=0"
    if status_filter:
        qs += f"&status_filter={status_filter}"
    url = f"{BOOKING_QUERY_BASE_URL}/api/v1/queries/bookings?{qs}"
    return await _get_json(url, headers=headers)

async def fetch_bookings_for_user(user_id: str, auth_header: Optional[str], status_filter: str | None = None) -> dict:
    headers = {"Authorization": auth_header} if auth_header else None
    qs = f"user_id={user_id}&limit=200&offset=0"
    if status_filter:
        qs += f"&status_filter={status_filter}"
    url = f"{BOOKING_QUERY_BASE_URL}/api/v1/queries/bookings?{qs}"
    return await _get_json(url, headers=headers)

async def fetch_maintenance_tickets(classroom_id: str, auth_header: Optional[str]) -> dict:
    headers = {"Authorization": auth_header} if auth_header else None
    url = f"{MAINTENANCE_SERVICE_BASE_URL}/api/v1/maintenance/tickets?classroom_id={classroom_id}&limit=200&offset=0"
    return await _get_json(url, headers=headers)
