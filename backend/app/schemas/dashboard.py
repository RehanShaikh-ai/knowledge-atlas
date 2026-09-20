"""Knowledge Dashboard Pydantic schemas.

Canonical schemas per contract §4.2 and §9.
"""

import uuid

from pydantic import BaseModel, Field


class ConnectedNote(BaseModel):
    """Note ranked by connectivity in the workspace."""

    id: uuid.UUID
    title: str
    degree: int


class TagDistributionItem(BaseModel):
    """Tag frequency count across notes in the workspace."""

    tag: str
    note_count: int


class DashboardResponse(BaseModel):
    """Response schema for GET /api/v1/workspaces/{id}/dashboard."""

    total_notes: int
    total_relationships: int
    total_tags: int
    total_sources: int
    notes_created_last_7_days: int
    isolated_notes_count: int
    most_connected_notes: list[ConnectedNote] = Field(default_factory=list)
    tag_distribution: list[TagDistributionItem] = Field(default_factory=list)
    import_status_summary: dict[str, int] = Field(default_factory=dict)
