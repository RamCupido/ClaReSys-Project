import sys
from pathlib import Path

# Actual archive: apps/classroom-service/src/tests/conftest.py
# 0=tests, 1=src, 2=classroom-service, 3=apps, 4=repo_root
REPO_ROOT = Path(__file__).resolve().parents[4]

COMMON_SRC = REPO_ROOT / "packages" / "common" / "src"
SERVICE_ROOT = REPO_ROOT / "apps" / "classroom-service"

# For allow "import common..."
if str(COMMON_SRC) not in sys.path:
    sys.path.insert(0, str(COMMON_SRC))

# For allow "import src...." from classroom-service
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))
