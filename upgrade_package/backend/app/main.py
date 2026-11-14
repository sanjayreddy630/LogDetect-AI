from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.analysis import router
from app.database.db import initialize_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="LogDetect AI",
    description="AI-powered log analysis and troubleshooting platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(router)


@app.get("/")
def home():
    return {
        "application": "LogDetect AI",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
