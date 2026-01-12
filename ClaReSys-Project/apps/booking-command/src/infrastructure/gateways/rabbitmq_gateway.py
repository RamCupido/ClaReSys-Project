import os
import json
import pika
from src.domain.ports import EventBusGateway

class RabbitMQGateway(EventBusGateway):
    def __init__(self):
        self.host = os.getenv("RABBITMQ_HOST", "rabbitmq")
        self.port = int(os.getenv("RABBITMQ_PORT", 5672))
        self.connection = None
        self.channel = None

    def _connect(self):
        """Conection to RabbitMQ server"""
        if not self.connection or self.connection.is_closed:
            params = pika.ConnectionParameters(host=self.host, port=self.port)
            self.connection = pika.BlockingConnection(params)
            self.channel = self.connection.channel()
            self.channel.exchange_declare(exchange='booking_events', exchange_type='topic')

    def publish(self, event_type: str, payload: dict):
        try:
            self._connect()
            message = json.dumps(payload)
            # Routing key
            routing_key = event_type
            
            self.channel.basic_publish(
                exchange='booking_events',
                routing_key=routing_key,
                body=message
            )
            print(f"[Evento publicado en RabbitMQ: {event_type}]")
        except Exception as e:
            print(f"[Error publicando en RabbitMQ: {e}]")
            