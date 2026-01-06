# apps/classroom-service/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Copiamos las dependencias e instalamos
COPY apps/classroom-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos la carpeta packages dentro del contenedor
COPY packages/common /packages/common
RUN pip install -e /packages/common

# Copiamos el resto del código fuente
COPY apps/classroom-service/ .

# Exponemos el puerto donde correrá FastAPI
EXPOSE 8000

# Comando para iniciar la app (usamos --reload para desarrollo)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]