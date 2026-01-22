import os
from typing import Optional
import httpx


class UserClient:
    def __init__(self):
        self.base_url = os.getenv("USER_SERVICE_BASE_URL")
        if not self.base_url:
            raise RuntimeError("Missing required environment variable: USER_SERVICE_BASE_URL")

    def get_email_by_user_id(self, user_id: str) -> Optional[str]:
        url = f"{self.base_url.rstrip('/')}/{user_id}"
        try:
            r = httpx.get(url, timeout=10)
            if r.status_code == 404:
                return None
            r.raise_for_status()
            data = r.json()
            return data.get("email")
        except Exception as e:
            print(f"[notification-service] Error fetching user email for user_id={user_id}: {e}")
            return None
