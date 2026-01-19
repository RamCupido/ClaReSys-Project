import os

def env(key: str, default: str | None = None) -> str:
    v = os.getenv(key, default)
    if v is None:
        raise RuntimeError(f"Missing required env var: {key}")
    return v

BOOKING_QUERY_BASE_URL = env("BOOKING_QUERY_BASE_URL", "http://booking-query:8000")
CLASSROOM_SERVICE_BASE_URL = env("CLASSROOM_SERVICE_BASE_URL", "http://classroom-service:8000")
MAINTENANCE_SERVICE_BASE_URL = env("MAINTENANCE_SERVICE_BASE_URL", "http://maintenance-service:8000")

REQUEST_TIMEOUT_SECONDS = float(env("REQUEST_TIMEOUT_SECONDS", "10"))
