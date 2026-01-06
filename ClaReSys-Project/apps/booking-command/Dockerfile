# apps/booking-command/Dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY apps/booking-command/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY packages/common /packages/common
RUN pip install -e /packages/common

COPY apps/timetable-engine/protos/timetable.proto ./protos/timetable.proto

COPY apps/booking-command/ .

RUN python -m grpc_tools.protoc -I./protos --python_out=./src --grpc_python_out=./src ./protos/timetable.proto

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]