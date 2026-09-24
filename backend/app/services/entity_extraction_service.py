"""Entity extraction service.

Canonical service per CONTRACT v0.3.2 §5.3, §8.1-§8.3.
Extracts entities and concepts from notes using LLM structured output.
"""

import json
import logging
import re
import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ExtractionFailedError
from app.models.entity_chunk import EntityChunk
from app.models.graph_entity import VALID_ENTITY_TYPES, GraphEntity
from app.models.note import Note
from app.models.note_chunk import NoteChunk
from app.services import llm_service

logger = logging.getLogger("app.services.entity_extraction_service")

EXTRACTION_SYSTEM_PROMPT = """You are a knowledge graph entity extraction assistant.
Extract important concepts, entities, people, technologies, projects, places,
and events from the given text.
Return ONLY a valid JSON object in the following format:
{
  "entities": [
    {
      "name": "Entity Name",
      "type": "concept|person|technology|project|place|event|unknown",
      "description": "Short explanation of what this entity is in context"
    }
  ]
}
Do not include any additional commentary or markdown formatting outside the JSON block.
"""


def _clean_json_text(text: str) -> str:
    """Strip markdown code fence if present."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    return text.strip()


def extract_entities(text: str, model: str | None = None) -> list[dict[str, Any]]:
    """Call LLM to extract entities as structured JSON dictionaries per CONTRACT §8.2."""
    if not text or not text.strip():
        return []

    provider = llm_service.get_llm_provider()
    messages = [
        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
        {"role": "user", "content": f"Extract entities from this text:\n\n{text}"},
    ]

    try:
        response_text = provider.generate(messages)
    except Exception as e:
        logger.warning("LLM generation failed for entity extraction: %s", e)
        raise ExtractionFailedError(f"Entity extraction failed: {e}") from e

    cleaned = _clean_json_text(response_text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.warning("Malformed JSON returned by LLM during entity extraction: %s", e)
        # Check if fallback deterministic parsing can extract entities from lines
        entities_list: list[dict[str, Any]] = []
        for line in response_text.splitlines():
            line = line.strip(" -*#\t")
            if ":" in line and len(line) < 100:
                parts = line.split(":", 1)
                name = parts[0].strip()
                desc = parts[1].strip()
                if name and len(name) <= 200:
                    entities_list.append({"name": name, "type": "concept", "description": desc})
        if entities_list:
            data = {"entities": entities_list}
        else:
            raise ExtractionFailedError("LLM returned malformed JSON for entity extraction.") from e

    if (
        not isinstance(data, dict)
        or "entities" not in data
        or not isinstance(data["entities"], list)
    ):
        return []

    sanitized_entities = []
    for item in data["entities"]:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "")).strip()
        if not name or len(name) > 200:
            continue
        etype = str(item.get("type", "concept")).strip().lower()
        if etype not in VALID_ENTITY_TYPES:
            etype = "unknown"
        desc = item.get("description")
        desc_str = str(desc).strip() if desc else None
        sanitized_entities.append(
            {
                "name": name,
                "type": etype,
                "description": desc_str,
            }
        )

    return sanitized_entities


def extract_entities_for_note(
    db: Session,
    note_id: uuid.UUID,
    model: str | None = None,
) -> list[GraphEntity]:
    """Extract entities for a note and upsert GraphEntity and EntityChunk records.

    Follows CONTRACT §8.1-§8.3.
    """
    note = db.get(Note, note_id)
    if not note:
        return []

    # Get note chunks
    chunks = db.scalars(
        select(NoteChunk).where(NoteChunk.note_id == note_id).order_by(NoteChunk.chunk_index.asc())
    ).all()

    extraction_model = model or getattr(settings, "LLM_MODEL", "local-llm")
    extracted_entities_by_chunk: list[tuple[NoteChunk | None, list[dict[str, Any]]]] = []

    if chunks:
        for chunk in chunks:
            raw_entities = extract_entities(chunk.content, model=extraction_model)
            if raw_entities:
                extracted_entities_by_chunk.append((chunk, raw_entities))
    else:
        raw_entities = extract_entities(note.content or note.title, model=extraction_model)
        if raw_entities:
            extracted_entities_by_chunk.append((None, raw_entities))

    saved_entities: list[GraphEntity] = []

    for chunk, entities in extracted_entities_by_chunk:
        for ent_data in entities:
            name = ent_data["name"]
            etype = ent_data["type"]
            desc = ent_data["description"]

            # Case-insensitive lookup per CONTRACT §8.3
            existing = db.scalars(
                select(GraphEntity).where(
                    GraphEntity.workspace_id == note.workspace_id,
                    func.lower(GraphEntity.name) == name.lower(),
                )
            ).first()

            if existing:
                entity = existing
                # If existing is manual, do not overwrite name/type/description (§8.3)
                if not existing.is_manual:
                    if desc and not existing.description:
                        existing.description = desc
            else:
                entity = GraphEntity(
                    workspace_id=note.workspace_id,
                    name=name,
                    entity_type=etype,
                    description=desc,
                    is_manual=False,
                )
                db.add(entity)
                db.flush()

            saved_entities.append(entity)

            # Record provenance in EntityChunk if chunk exists
            if chunk:
                prov_existing = db.scalars(
                    select(EntityChunk).where(
                        EntityChunk.entity_id == entity.id,
                        EntityChunk.chunk_id == chunk.id,
                    )
                ).first()

                if not prov_existing:
                    prov = EntityChunk(
                        entity_id=entity.id,
                        chunk_id=chunk.id,
                        note_id=note.id,
                        workspace_id=note.workspace_id,
                        extraction_model=extraction_model,
                        confidence=0.9,
                    )
                    db.add(prov)

    db.commit()
    # Return unique entities extracted for this note
    seen_ids = set()
    unique_entities = []
    for e in saved_entities:
        if e.id not in seen_ids:
            seen_ids.add(e.id)
            unique_entities.append(e)
    return unique_entities
