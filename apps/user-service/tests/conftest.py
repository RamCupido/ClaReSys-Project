# apps/user-service/tests/conftest.py
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

SERVICE_ROOT = REPO_ROOT / "apps" / "user-service"
COMMON_SRC = REPO_ROOT / "packages" / "common" / "src"

sys.path.insert(0, str(SERVICE_ROOT))
sys.path.insert(0, str(COMMON_SRC))
