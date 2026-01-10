# apps/classroom-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY apps/classroom-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY packages/common /packages/common
RUN pip install -e /packages/common

COPY apps/classroom-service/ .

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]