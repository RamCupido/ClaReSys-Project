import os
import grpc
from datetime import datetime
from typing import List, Tuple

# Importamos lo generado y los puertos
from src.domain.ports import TimetableGateway
import src.timetable_pb2 as pb2
import src.timetable_pb2_grpc as pb2_grpc

class GrpcTimetableGateway(TimetableGateway):
    def __init__(self):
        # Conexión al servicio gRPC (nombre del servicio en docker-compose)
        host = os.getenv("TIMETABLE_SERVICE_HOST", "timetable-engine")
        port = os.getenv("TIMETABLE_SERVICE_PORT", "50051")
        self.channel_url = f"{host}:{port}"

    def check_availability(self, start: datetime, end: datetime, existing_bookings: List[Tuple[datetime, datetime]]) -> bool:
        try:
            # Abrimos canal inseguro (interno)
            with grpc.insecure_channel(self.channel_url) as channel:
                stub = pb2_grpc.TimetableCheckerStub(channel)
                
                # Convertimos datetime a string ISO para el proto
                candidate = pb2.TimeRange(
                    start=start.isoformat(),
                    end=end.isoformat()
                )
                
                existing_protos = []
                for ex_start, ex_end in existing_bookings:
                    existing_protos.append(pb2.TimeRange(
                        start=ex_start.isoformat(),
                        end=ex_end.isoformat()
                    ))
                
                request = pb2.CheckRequest(
                    candidate=candidate,
                    existing_bookings=existing_protos
                )
                
                # Llamada remota (RPC)
                response = stub.CheckAvailability(request)
                
                # Si has_conflict es True, NO está disponible
                # Si has_conflict es False, SÍ está disponible
                return not response.has_conflict
                
        except grpc.RpcError as e:
            print(f"Error gRPC: {e}")
            # Por seguridad, si falla el motor, asumimos que NO hay disponibilidad
            return False