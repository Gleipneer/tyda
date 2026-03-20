"""
Reflektionsarkiv – FastAPI backend.
Primär ingångspunkt för API:t.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, users, auth, admin, admin_database_queries, categories, posts, concepts, activity, analytics, analyze, interpret

app = FastAPI(
    title="Reflektionsarkiv API",
    description="API ovanpå databasen reflektionsarkiv",
    version="0.1.0",
)

# CORS: lokala Vite-portar som standard; sätt CORS_ORIGINS (kommaseparerade URL:er) i produktion
_default_cors = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]
_cors_extra = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
_cors_origins = _default_cors + [o for o in _cors_extra if o not in _default_cors]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(admin.router, prefix="/api", tags=["admin"])
app.include_router(admin_database_queries.router, prefix="/api", tags=["admin-database-queries"])
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
