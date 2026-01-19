import os

def env(key: str, default: str | None = None) -> str:
    v = os.getenv(key, default)
    if v is None:
        raise RuntimeError(f"Missing required env var: {key}")
    return v

ENV = env("ENV", "development")

MONGO_URI = env("MONGO_URI", "mongodb://mongodb:27017")
MONGO_DB = env("MONGO_DB", "claresys")
MONGO_COLLECTION = env("MONGO_COLLECTION", "audit_logs")

KAFKA_BOOTSTRAP_SERVERS = env("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC_AUDIT = env("KAFKA_TOPIC_AUDIT", "audit.logs")
KAFKA_CONSUMER_GROUP = env("KAFKA_CONSUMER_GROUP", "audit-log-service")
KAFKA_ENABLE_CONSUMER = env("KAFKA_ENABLE_CONSUMER", "true").lower() == "true"
