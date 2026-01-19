from pymongo import MongoClient
from pymongo.collection import Collection

from .config import MONGO_URI, MONGO_DB, MONGO_COLLECTION

_client: MongoClient | None = None

def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client

def get_collection() -> Collection:
    client = get_mongo_client()
    db = client[MONGO_DB]
    col = db[MONGO_COLLECTION]

    # Ensure indexes
    col.create_index("timestamp")
    col.create_index("actor_user_id")
    col.create_index("service")
    col.create_index("action")
    col.create_index("resource_id")
    col.create_index("correlation_id")
    return col
