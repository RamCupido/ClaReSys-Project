import os
import json
from kafka import KafkaProducer

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC_AUDIT = os.getenv("KAFKA_TOPIC_AUDIT", "audit.logs")

_producer = KafkaProducer(
    bootstrap_servers=[s.strip() for s in KAFKA_BOOTSTRAP_SERVERS.split(",") if s.strip()],
    value_serializer=lambda v: json.dumps(v, ensure_ascii=False).encode("utf-8"),
    linger_ms=5,
    acks=1,
)

def emit_audit_event(event: dict) -> None:
    _producer.send(KAFKA_TOPIC_AUDIT, event)
