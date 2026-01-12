FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

COPY protos/ ./protos/

EXPOSE 50051

CMD ["python", "src/server.py"]