from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Custom Receipt Framework API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# API routes
from app.api.v1 import receipts, auth, backup, templates

app.include_router(receipts.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(backup.router, prefix="/api/v1")
app.include_router(templates.router, prefix="/api/v1")
