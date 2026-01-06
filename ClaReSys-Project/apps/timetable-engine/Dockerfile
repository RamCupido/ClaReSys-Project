FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos código y protos
COPY src/ ./src/
COPY protos/ ./protos/

# Exponemos el puerto gRPC
EXPOSE 50051

# Ejecutamos el servidor desde la raíz de /app
CMD ["python", "src/server.py"]