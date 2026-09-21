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


@router.post("/workspaces/{workspace_id}/rag", response_model=RAGResponse)
def execute_rag(
    workspace_id: uuid.UUID,
    request: RAGRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Execute RAG pipeline with grounded citations and optional SSE streaming."""
    query = request.query.strip()
    if not query:
        raise ValidationError("Query must not be empty or whitespace only.")

    if request.stream:
        # Streaming response via SSE per CONTRACT §10.4
        def event_stream():
            try:
                # First run retrieval and validation
                rag_res = rag_service.run_rag(db, workspace_id, request)
                # Stream answer chunks
                for word in rag_res.answer.split():
                    chunk_data = json.dumps({"type": "chunk", "content": word + " "})
                    yield f"data: {chunk_data}\n\n"

                done_data = json.dumps(
                    {
                        "type": "done",
                        "citations": [c.model_dump(mode="json") for c in rag_res.citations],
                        "provider": rag_res.provider,
                        "model": rag_res.model,
                        "latency_ms": rag_res.latency_ms,
                    }
                )
                yield f"data: {done_data}\n\n"
            except Exception as e:
                err_data = json.dumps(
                    {"type": "error", "code": "LLM_PROVIDER_UNAVAILABLE", "message": str(e)}
                )
                yield f"data: {err_data}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    return rag_service.run_rag(db, workspace_id, request)
