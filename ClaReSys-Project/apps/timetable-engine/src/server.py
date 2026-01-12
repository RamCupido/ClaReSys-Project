import grpc
from concurrent import futures
import time
import sys
import os

import grpc_tools.protoc
from grpc_tools import protoc

# 1. Compilación al vuelo de los .proto (Solo para desarrollo)
# Esto genera timetable_pb2.py y timetable_pb2_grpc.py automáticamente
protoc.main((
    '',
    '-I./protos',
    '--python_out=./src',
    '--grpc_python_out=./src',
    './protos/timetable.proto',
))

# Agregamos src al path para poder importar los archivos generados
sys.path.append('./src')

import timetable_pb2
import timetable_pb2_grpc
from logic import check_overlap

class TimetableService(timetable_pb2_grpc.TimetableCheckerServicer):
    def CheckAvailability(self, request, context):
        print(f"[Timetable Engine] Validando candidato: {request.candidate.start} - {request.candidate.end}")
        
        # Convertimos el formato gRPC a una lista simple de tuplas para nuestra lógica
        existing_list = [(x.start, x.end) for x in request.existing_bookings]
        
        # Ejecutamos la lógica pura
        has_conflict = check_overlap(
            request.candidate.start,
            request.candidate.end,
            existing_list
        )
        
        msg = "Conflicto detectado" if has_conflict else "Horario disponible"
        if has_conflict:
            print(f"[Timetable Engine] {msg}")
        else:
            print(f"[Timetable Engine] {msg}")

        return timetable_pb2.CheckResponse(has_conflict=has_conflict, conflict_details=msg)

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    timetable_pb2_grpc.add_TimetableCheckerServicer_to_server(TimetableService(), server)
    
    # gRPC puerto 50051 por defecto
    server.add_insecure_port('[::]:50051')
    print("Timetable Engine listening on port 50051...")
    server.start()
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve()