"""FastAPI application entry point.

Canonical module per contract §4.1.
The FastAPI application object 'app' is defined here.
Canonical import: from app.main import app
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers

# Configure logging with canonical root "app" per contract §24
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("app")

app = FastAPI(
    title="Collaborative Second Brain",
    version="0.1.1",
    description="Backend API for Collaborative Second Brain",
)

# Register global exception handlers (contract §4.4, §12)
register_exception_handlers(app)

# CORS middleware (contract §23)
# Uses FRONTEND_URL from settings; wildcard origins must not be used as default.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router under /api/v1 prefix (contract §4.3, §9)
# main.py must not mount individual sub-routers directly.
app.include_router(api_router, prefix="/api/v1")

logger.info("Collaborative Second Brain backend initialized (APP_ENV=%s)", settings.APP_ENV)
