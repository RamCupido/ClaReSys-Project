import pika
import json
import os
import sys
import time
from email_sender import EmailSender
from user_client import UserClient

RABBIT_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBIT_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
user_client = None

def handle_message(body: bytes, email_sender: EmailSender) -> bool:
    global user_client

    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception as e:
        print(f"[notification-service] Invalid JSON: {e}")
        return False

    booking_id = payload.get("booking_id")
    status = payload.get("status")

    email = payload.get("email")

    if not email:
        user_id = payload.get("user_id")
        if user_id:
            if user_client is None:
                user_client = UserClient()
            email = user_client.get_email_by_user_id(str(user_id))

    if not email or not booking_id or not status:
        print(f"[notification-service] Missing fields. email={email}, booking_id={booking_id}, status={status}")
        return False
    
    print(f"[notification-service] resolved email={email} user_id={payload.get('user_id')} booking_id={booking_id}")
    return email_sender.send_booking_confirmation(str(email), str(booking_id), str(status))

def main():
    email_sender = EmailSender()
    
    connection = None
    while not connection:
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=RABBIT_HOST, port=RABBIT_PORT)
            )
        except pika.exceptions.AMQPConnectionError:
            print("Esperando a RabbitMQ...")
            time.sleep(5)

    channel = connection.channel()
    channel.exchange_declare(exchange='booking_events', exchange_type='topic')
    
    result = channel.queue_declare(queue='notification_sender', exclusive=False)
    queue_name = result.method.queue
    
    channel.queue_bind(exchange='booking_events', queue=queue_name, routing_key='booking.created')

    print("Notification Service esperando eventos...")

    def callback(ch, method, properties, body):
        ok = handle_message(body, email_sender)
        try:
            event_data = json.loads(body.decode("utf-8"))
        except Exception:
            event_data = {"raw": body}

        print(f"Evento recibido: {event_data} | email_sent={ok}")

    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
    channel.start_consuming()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("Interrumpido")
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)