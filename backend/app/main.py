"""
Reflektionsarkiv – FastAPI backend.
Primär ingångspunkt för API:t.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.migrations_runner import run_all_migrations
from app.routers import health, users, auth, categories, posts, concepts, activity, analytics, analyze, interpret


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Kör migrationskedjan innan API:t tar emot trafik (idempotent; samma ordning som database/migrations/*.sql)."""
    run_all_migrations(emit=True)
    yield


app = FastAPI(
    title="Reflektionsarkiv API",
    description="API ovanpå databasen reflektionsarkiv",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS så att frontend kan anropa backend under utveckling
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5174", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(categories.router, prefix="/api", tags=["categories"])
app.include_router(posts.router, prefix="/api", tags=["posts"])
app.include_router(concepts.router, prefix="/api", tags=["concepts"])
app.include_router(activity.router, prefix="/api", tags=["activity"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])
app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(interpret.router, prefix="/api", tags=["interpret"])


@app.get("/")
def root():
    """Rot-endpoint för snabb kontroll."""
    return {"message": "Reflektionsarkiv API", "docs": "/docs"}
