import os
import requests
from uuid import UUID
from typing import Optional, Dict, Any
from src.domain.ports import ClassroomGateway

class HttpClassroomGateway(ClassroomGateway):
    def __init__(self):
        self.base_url = os.getenv("CLASSROOM_SERVICE_URL", "http://classroom-service:8000")

    def get_classroom(self, classroom_id: UUID) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/api/v1/classrooms/{classroom_id}"
        try:
            resp = requests.get(url, timeout=5)

            if resp.status_code == 404:
                return None

            resp.raise_for_status()
            return resp.json()

        except requests.RequestException as e:
            print(f"[booking-command] Classroom gateway error: {e}")
            return None
