FROM python:3.11-slim

WORKDIR /app

COPY apps/notification-service/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY apps/notification-service/src/ .

CMD ["python", "-u", "main.py"]