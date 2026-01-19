from pymongo import MongoClient
from pymongo.collection import Collection
from src.config.config import MONGO_URI, MONGO_DB, MONGO_COLLECTION

_client: MongoClient | None = None
_initialized = False

def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client

def get_collection() -> Collection:
    global _initialized
    col = get_client()[MONGO_DB][MONGO_COLLECTION]

    if not _initialized:
        col.create_index("ticket_id", unique=True)
        col.create_index("classroom_id")
        col.create_index("status")
        col.create_index("priority")
        col.create_index("created_at")
        _initialized = True

    return col
