"""RAG API route.

Canonical endpoint per CONTRACT v0.3.1 §10.2, §10.4, §13.1.
POST /api/v1/workspaces/{workspace_id}/rag
"""

import json
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.exceptions import ValidationError
from app.db.session import get_db
from app.schemas.rag import RAGRequest, RAGResponse
from app.services import rag_service

router = APIRouter()


@router.get("/workspaces/{workspace_id}/rag/status")
def get_rag_status(
    workspace_id: uuid.UUID,
):
    """Return AI Provider status, reachability, active model, and recommended models."""
    from app.core.config import settings
    from app.services import llm_service

    is_healthy = False
    provider_name = settings.LLM_PROVIDER
    active_model = settings.LLM_MODEL
    base_url = settings.FREELLMAPI_BASE_URL

    try:
        provider = llm_service.get_llm_provider()
        is_healthy = provider.health_check()
        provider_name = provider.provider_name()
        active_model = provider.model_name()
    except Exception:
        is_healthy = False

    return {
        "provider": provider_name,
        "healthy": is_healthy,
        "current_model": active_model,
        "base_url": base_url,
        "recommended_models": llm_service.RECOMMENDED_MODELS,
    }


@router.post("/workspaces/{workspace_id}/rag", response_model=RAGResponse)
def execute_rag(
    workspace_id: uuid.UUID,
    request: RAGRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Execute RAG pipeline with grounded citations and optional real SSE streaming."""
    query = request.query.strip()
    if not query:
        raise ValidationError("Query must not be empty or whitespace only.")

    if request.stream:
        # Real token streaming response via SSE per CONTRACT §10.4
        def event_stream():
            try:
                for event in rag_service.stream_rag(db, workspace_id, request):
                    yield f"data: {json.dumps(event)}\n\n"
            except Exception as e:
                err_data = json.dumps(
                    {"type": "error", "code": "LLM_STREAM_ERROR", "message": str(e)}
                )
                yield f"data: {err_data}\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    return rag_service.run_rag(db, workspace_id, request)
