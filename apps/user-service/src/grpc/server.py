import grpc
from concurrent import futures
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.models.user import User
import src.user_pb2 as user_pb2
import src.user_pb2_grpc as user_pb2_grpc

class UserProviderServicer(user_pb2_grpc.UserProviderServicer):
    def GetUserByEmail(self, request, context):
        db: Session = SessionLocal()
        try:
            user = db.query(User).filter(User.email == request.email).first()
            if user:
                return user_pb2.UserResponse(
                    id=str(user.id),
                    email=user.email,
                    password_hash=user.password_hash,
                    role=user.role,
                    is_active=user.is_active,
                    found=True
                )
            else:
                return user_pb2.UserResponse(found=False)
        finally:
            db.close()

def serve_grpc():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    user_pb2_grpc.add_UserProviderServicer_to_server(UserProviderServicer(), server)
    server.add_insecure_port('[::]:50051')
    print("User Service (gRPC) escuchando en puerto 50051")
    server.start()
    server.wait_for_termination()