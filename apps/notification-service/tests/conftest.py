# apps/notification-service/tests/conftest.py
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

SERVICE_ROOT = REPO_ROOT / "apps" / "notification-service"
SRC_DIR = SERVICE_ROOT / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
