import json
import threading
from kafka import KafkaConsumer

from src.config.config import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_CONSUMER_GROUP,
    KAFKA_TOPIC_AUDIT,
)
from src.config.db import get_collection

def start_consumer(stop_event: threading.Event):
    col = get_collection()

    consumer = KafkaConsumer(
        KAFKA_TOPIC_AUDIT,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS.split(","),
        group_id=KAFKA_CONSUMER_GROUP,
        enable_auto_commit=True,
        auto_offset_reset="earliest",
        value_deserializer=lambda v: v.decode("utf-8"),
    )

    try:
        for msg in consumer:
            if stop_event.is_set():
                break

            try:
                data = json.loads(msg.value)
                col.insert_one(data)
            except Exception:
                continue
    finally:
        try:
            consumer.close()
        except Exception:
            pass
