FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY apps/user-service/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY apps/user-service/ .

RUN python -m grpc_tools.protoc -I./protos --python_out=./src --grpc_python_out=./src ./protos/user.proto

RUN sed -i 's/import user_pb2 as/from . import user_pb2 as/' src/user_pb2_grpc.py

EXPOSE 8000 50051

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]