import pika
import json
import os
import sys
import time
from email_sender import EmailSender

# Configuration
RABBIT_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBIT_PORT = int(os.getenv("RABBITMQ_PORT", 5672))

def handle_message(body: bytes, email_sender: EmailSender) -> bool:
    payload = json.loads(body.decode("utf-8"))

    email = payload.get("email")
    booking_id = payload.get("booking_id")
    status = payload.get("status")

    if not email or not booking_id or not status:
        return False

    return email_sender.send_booking_confirmation(email, booking_id, status)

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
    
    # Queue for notification sender
    result = channel.queue_declare(queue='notification_sender', exclusive=False)
    queue_name = result.method.queue
    
    # Listen for booking created events
    channel.queue_bind(exchange='booking_events', queue=queue_name, routing_key='booking.created')

    print("Notification Service esperando eventos...")

    def callback(ch, method, properties, body):
        handle_message(body, email_sender)
        event_data = json.loads(body)
        print(f"Evento recibido: {event_data}")
        
        # Extarct booking details
        booking_id = event_data.get("booking_id")
        email = event_data.get("email", "usuario@ejemplo.com")
        status = event_data.get("status")
        
        email_sender.send_booking_confirmation(email, booking_id, status)

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