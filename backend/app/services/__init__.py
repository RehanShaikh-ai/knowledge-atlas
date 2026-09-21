"""Services package.

Canonical module per contract §15.
"""

from app.services import (
    activity_service,
    chunking_service,
    dashboard_service,
    embedding_service,
    git_service,
    graph_service,
    job_service,
    llm_service,
    note_service,
    obsidian_parser,
    rag_service,
    reranking_service,
    retrieval_service,
    saved_search_service,
    search_service,
    source_service,
    tag_service,
    user_service,
    vector_service,
    version_service,
    workspace_service,
)

__all__ = [
    # v0.2.x
    "dashboard_service",
    "graph_service",
    "note_service",
    "obsidian_parser",
    "search_service",
    "source_service",
    "tag_service",
    "user_service",
    "workspace_service",
    # v0.3.1 (CONTRACT §5.3)
    "activity_service",
    "chunking_service",
    "embedding_service",
    "git_service",
    "job_service",
    "llm_service",
    "rag_service",
    "reranking_service",
    "retrieval_service",
    "saved_search_service",
    "vector_service",
    "version_service",
]
