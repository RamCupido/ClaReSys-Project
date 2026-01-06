import os
import grpc
import src.user_pb2 as user_pb2
import src.user_pb2_grpc as user_pb2_grpc

class UserGateway:
    def __init__(self):
        self.host = os.getenv("USER_SERVICE_HOST", "user-service")
        self.port = "50051"
        self.channel = grpc.insecure_channel(f"{self.host}:{self.port}")
        self.stub = user_pb2_grpc.UserProviderStub(self.channel)

    def get_user_by_email(self, email: str):
        try:
            request = user_pb2.UserRequest(email=email)
            response = self.stub.GetUserByEmail(request)
            
            if not response.found:
                return None
                
            return response
        except grpc.RpcError as e:
            print(f"Error conectando con User Service: {e}")
            return None