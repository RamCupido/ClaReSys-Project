import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

SERVICE_ROOT = REPO_ROOT / "apps" / "maintenance-service"

if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))
