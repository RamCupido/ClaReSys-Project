# src/tests/conftest.py
import sys
from pathlib import Path

# apps/user-service/src/tests/conftest.py
# parents: tests(0) -> src(1) -> user-service(2) -> apps(3) -> repo_root(4)
REPO_ROOT = Path(__file__).resolve().parents[4]

SERVICE_ROOT = REPO_ROOT / "apps" / "user-service"
COMMON_SRC = REPO_ROOT / "packages" / "common" / "src"

if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

if str(COMMON_SRC) not in sys.path:
    sys.path.insert(0, str(COMMON_SRC))
