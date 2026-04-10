"""
Thadata Analytics — FastAPI backend entry point.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

# Ensure storage dirs exist
Path(os.getenv("UPLOAD_DIR", "uploads")).mkdir(exist_ok=True)
Path(os.getenv("DATA_DIR", "data")).mkdir(exist_ok=True)

from api.routes.analyze import router as analyze_router
from api.routes.ingest import router as ingest_router
from api.routes.datasets import router as datasets_router

from api.routes.team import router as team_router
from api.routes.alerts import router as alerts_router
from api.routes.integrations import router as integrations_router
from api.routes.simulator import router as simulator_router
from api.routes.analyses import router as analyses_router

from core.database import engine, Base, SessionLocal
from api.models_db import TeamMember, AlertItem, Integration, Scenario
import uuid
import datetime

def init_dummy_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Integration).first() is None:
            # Populate Integrations
            db.add_all([
                Integration(id="postgres", name="PostgreSQL", description="Connect PostgreSQL", category="Database", status="available", icon="Database", color="#336791"),
                Integration(id="ga4", name="Google Analytics 4", description="Import web analytics.", category="Analytics", status="connected", icon="BarChart2", color="#E37400", last_sync="2 hours ago"),
            ])
            db.commit()
            
        if db.query(Scenario).first() is None:
            # Populate Scenarios
            db.add_all([
                Scenario(id="1", name="Base Case", variable="revenue", change=10, unit="%"),
            ])
            db.commit()
    finally:
        db.close()



@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ Thadata Analytics API starting...")
    init_dummy_data()
    yield
    print("🛑 Thadata Analytics API shutting down...")


app = FastAPI(
    title="Thadata Analytics API",
    description="Autonomous AI Data Analyst powered by Groq + Llama 4 Scout",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Next.js frontend (localhost in dev, Vercel URL in prod)
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",   # allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(analyze_router)
app.include_router(ingest_router)
app.include_router(datasets_router)
app.include_router(team_router)
app.include_router(alerts_router)
app.include_router(integrations_router)
app.include_router(simulator_router)
app.include_router(analyses_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "Thadata Analytics API",
        "version": "1.0.0",
        "model": os.getenv("GROQ_MODEL_CONTENT"),
        "status": "running",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Unexpected error: {str(exc)}"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("APP_HOST", "0.0.0.0"),
        port=int(os.getenv("APP_PORT", 8000)),
        reload=True,
    )
