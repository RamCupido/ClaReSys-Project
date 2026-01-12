import time
import pika
import json
import threading
import os
from src.infrastructure.redis_client import get_redis_client

class EventConsumer(threading.Thread):
    def __init__(self):
        super().__init__()
        self.host = os.getenv("RABBITMQ_HOST", "rabbitmq")
        self.port = int(os.getenv("RABBITMQ_PORT", 5672))
        self.redis = get_redis_client()
        self.daemon = True

    def run(self):
        """This method runs in a separate thread so as not to block FastAPI"""
        attempt = 0
        while True:
            try:
                params = pika.ConnectionParameters(host=self.host, port=self.port)
                connection = pika.BlockingConnection(params)
                channel = connection.channel()
                
                channel.exchange_declare(exchange='booking_events', exchange_type='topic')
                
                # Queue for booking query updates
                result = channel.queue_declare(queue='booking_query_updater', exclusive=False)
                queue_name = result.method.queue
                
                # Subscribe to booking.created events
                channel.queue_bind(exchange='booking_events', queue=queue_name, routing_key='booking.created')
                channel.queue_bind(exchange='booking_events', queue=queue_name, routing_key='booking.canceled')

                print("Query Service escuchando eventos 'booking.created'...")
                channel.basic_consume(queue=queue_name, on_message_callback=self.process_event, auto_ack=True)
                channel.start_consuming()
                return
            
            except Exception as e:
                attempt += 1
                wait = min(2 ** attempt, 30)
                print(f"[booking-query] Error en consumidor RabbitMQ: ({e}). Reintentando en {wait}s...")
                time.sleep(wait)

    def process_event(self, ch, method, properties, body):
        try:
            event_data = json.loads(body)
            print(f"Evento recibido: {event_data}")

            booking_id = event_data.get('booking_id')
            if not booking_id:
                print("Evento inválido: falta booking_id")
                return
            
            # Logic to update Redis cache
            booking_key = f"booking:{booking_id}"
            self.redis.set(booking_key, json.dumps(event_data))
            
            # Also update classroom bookings list
            # Clave="classroom:{id}:bookings", Valor=Lista de IDs
            user_id = event_data.get('user_id')
            classroom_id = event_data.get('classroom_id')

            self.redis.sadd("bookings:all", booking_id)

            if user_id:
                self.redis.sadd(f"user:{user_id}:bookings", booking_id)
            if classroom_id:
                self.redis.sadd(f"classroom:{classroom_id}:bookings", booking_id)
            
            print(f"Guardado en Redis: {booking_key}")
            
        except Exception as e:
            print(f"Error procesando evento: {e}")