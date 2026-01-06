FROM python:3.11-slim

WORKDIR /app

COPY apps/auth-service/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY apps/auth-service/ .

RUN python -m grpc_tools.protoc -I./protos --python_out=./src --grpc_python_out=./src ./protos/user.proto

RUN sed -i 's/import user_pb2 as/from . import user_pb2 as/' src/user_pb2_grpc.py

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]