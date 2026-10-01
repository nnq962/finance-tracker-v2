from fastapi import FastAPI

from finance_backend.api.routes.health import router as health_router

app = FastAPI(title="Finance Backend", version="0.1.0")
app.include_router(health_router)
