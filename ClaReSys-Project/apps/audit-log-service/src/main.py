import threading
from fastapi import FastAPI

from src.config.config import SERVICE_NAME, KAFKA_ENABLE_CONSUMER
from src.routes.router import router
from .kafka_consumer import start_consumer

app = FastAPI(title=SERVICE_NAME)

app.include_router(router)

_stop_event = threading.Event()
_thread: threading.Thread | None = None

@app.get("/health")
def health():
    return {"status": "ok", "service": SERVICE_NAME}

@app.on_event("startup")
def on_startup():
    global _thread
    if KAFKA_ENABLE_CONSUMER:
        _thread = threading.Thread(target=start_consumer, args=(_stop_event,), daemon=True)
        _thread.start()

@app.on_event("shutdown")
def on_shutdown():
    _stop_event.set()
