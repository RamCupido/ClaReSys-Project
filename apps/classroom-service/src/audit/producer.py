import os
import json
from typing import Optional
from kafka import KafkaProducer

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC_AUDIT = os.getenv("KAFKA_TOPIC_AUDIT", "audit.logs")

AUDIT_ENABLED = os.getenv("AUDIT_ENABLED", "true").lower() == "true"

_producer: Optional[KafkaProducer] = None


def _get_producer() -> Optional[KafkaProducer]:
    """
    Inicializa el KafkaProducer de forma lazy.
    Nunca se ejecuta en import time.
    """
    global _producer

    if not AUDIT_ENABLED:
        return None

    if _producer is not None:
        return _producer

    try:
        _producer = KafkaProducer(
            bootstrap_servers=[
                s.strip()
                for s in KAFKA_BOOTSTRAP_SERVERS.split(",")
                if s.strip()
            ],
            value_serializer=lambda v: json.dumps(v, ensure_ascii=False).encode("utf-8"),
            linger_ms=5,
            acks=1,
            request_timeout_ms=2000,
            api_version_auto_timeout_ms=2000,
        )
        return _producer
    except Exception:
        _producer = None
        return None


def emit_audit_event(event: dict) -> None:
    """
    Envía evento a Kafka si está disponible.
    JAMÁS debe romper una request ni un test.
    """
    producer = _get_producer()
    if not producer:
        return

    try:
        producer.send(KAFKA_TOPIC_AUDIT, event)
    except Exception:
        return
