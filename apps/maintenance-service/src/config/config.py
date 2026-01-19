import os

def env(key: str, default: str | None = None) -> str:
    v = os.getenv(key, default)
    if v is None:
        raise RuntimeError(f"Missing required env var: {key}")
    return v

MONGO_URI = env("MONGO_URI", "mongodb://mongodb:27017")
MONGO_DB = env("MONGO_DB", "claresys")
MONGO_COLLECTION = env("MONGO_COLLECTION", "maintenance_tickets")

RABBITMQ_HOST = env("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(env("RABBITMQ_PORT", "5672"))
RABBITMQ_USER = env("RABBITMQ_USER", "guest")
RABBITMQ_PASSWORD = env("RABBITMQ_PASSWORD", "guest")
RABBITMQ_EXCHANGE = env("RABBITMQ_EXCHANGE", "domain.events")
