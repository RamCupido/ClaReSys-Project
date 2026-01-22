import json
import os
import ssl
import time
from typing import Any, Dict

import pika
import paho.mqtt.client as mqtt

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_EXCHANGE = os.getenv("RABBITMQ_EXCHANGE", "booking_events")
RABBITMQ_QUEUE = os.getenv("RABBITMQ_QUEUE", "mqtt.bridge")
RABBITMQ_BINDING_KEYS = [k.strip() for k in os.getenv("RABBITMQ_BINDING_KEYS", "booking.*").split(",") if k.strip()]

MQTT_HOST = os.getenv("MQTT_HOST", "emqx")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_WS_PATH = os.getenv("MQTT_WS_PATH")  # only for WS clients, not used here
MQTT_TOPIC_PREFIX = os.getenv("MQTT_TOPIC_PREFIX", "claresys")


MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
MQTT_TLS = os.getenv("MQTT_TLS", "false").lower() == "true"


def build_topics(event_type: str, payload: Dict[str, Any]) -> list[str]:
    classroom_id = payload.get("classroom_id") or payload.get("classroomId")
    booking_id = payload.get("booking_id") or payload.get("bookingId")
    user_id = payload.get("user_id") or payload.get("userId")

    topics: list[str] = []
    if classroom_id:
        topics.append(f"{MQTT_TOPIC_PREFIX}/classrooms/{classroom_id}/bookings")
    if booking_id:
        topics.append(f"{MQTT_TOPIC_PREFIX}/bookings/{booking_id}/status")
    if user_id:
        topics.append(f"{MQTT_TOPIC_PREFIX}/users/{user_id}/notifications")

    topics.append(f"{MQTT_TOPIC_PREFIX}/events/{event_type}")
    return topics


def build_envelope(event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "v": 1,
        "event": event_type,
        "occurredAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "data": payload,
    }


def mqtt_connect() -> mqtt.Client:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

    if MQTT_USERNAME is not None:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

    if MQTT_TLS:
        client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
        client.tls_insecure_set(False)

    def on_connect(_client, _userdata, _flags, rc, _props=None):
        if rc == 0:
            print("[mqtt-bridge] Connected to MQTT")
        else:
            print(f"[mqtt-bridge] MQTT connection failed rc={rc}")

    def on_disconnect(_client, _userdata, rc, _props=None):
        print(f"[mqtt-bridge] Disconnected from MQTT rc={rc}")

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect

    client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    client.loop_start()
    return client


def rabbitmq_connect() -> tuple[pika.BlockingConnection, pika.channel.Channel]:
    params = pika.ConnectionParameters(host=RABBITMQ_HOST, port=RABBITMQ_PORT, heartbeat=30)
    conn = pika.BlockingConnection(params)
    ch = conn.channel()
    ch.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type="topic", durable=False)
    ch.queue_declare(queue=RABBITMQ_QUEUE, durable=False)

    for key in RABBITMQ_BINDING_KEYS:
        ch.queue_bind(exchange=RABBITMQ_EXCHANGE, queue=RABBITMQ_QUEUE, routing_key=key)

    print(f"[mqtt-bridge] RabbitMQ exchange={RABBITMQ_EXCHANGE} queue={RABBITMQ_QUEUE} keys={RABBITMQ_BINDING_KEYS}")
    return conn, ch


def main() -> None:
    mqtt_client = mqtt_connect()
    conn, ch = rabbitmq_connect()

    def callback(_ch, method, _properties, body: bytes):
        event_type = method.routing_key
        try:
            payload = json.loads(body.decode("utf-8"))
        except Exception as e:
            print(f"[mqtt-bridge] Invalid JSON for event={event_type}: {e}")
            return

        envelope = build_envelope(event_type, payload)
        topics = build_topics(event_type, payload)

        data = json.dumps(envelope, separators=(",", ":")).encode("utf-8")

        for t in topics:
            mqtt_client.publish(t, data, qos=0, retain=False)

        print(f"[mqtt-bridge] {event_type} -> {len(topics)} topics")

    ch.basic_consume(queue=RABBITMQ_QUEUE, on_message_callback=callback, auto_ack=True)
    print("[mqtt-bridge] Waiting for RabbitMQ events...")

    try:
        ch.start_consuming()
    except KeyboardInterrupt:
        pass
    finally:
        try:
            mqtt_client.loop_stop()
            mqtt_client.disconnect()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()
