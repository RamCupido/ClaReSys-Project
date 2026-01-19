import json
from datetime import datetime, timezone
import pika

from src.config.config import (
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USER,
    RABBITMQ_PASSWORD,
    RABBITMQ_EXCHANGE,
)

class EventPublisher:
    def __init__(self):
        creds = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
        params = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=creds,
            heartbeat=30,
        )
        self._conn = pika.BlockingConnection(params)
        self._ch = self._conn.channel()
        self._ch.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type="topic", durable=True)

    def publish(self, routing_key: str, payload: dict):
        body = json.dumps(payload, default=str).encode("utf-8")
        self._ch.basic_publish(
            exchange=RABBITMQ_EXCHANGE,
            routing_key=routing_key,
            body=body,
            properties=pika.BasicProperties(content_type="application/json"),
        )

    def close(self):
        try:
            self._conn.close()
        except Exception:
            pass


def build_event(service: str, event_type: str, data: dict) -> dict:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": service,
        "event_type": event_type,
        "data": data,
    }
