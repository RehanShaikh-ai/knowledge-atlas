"""Reranking service for post-retrieval candidate reordering.

Canonical service per CONTRACT v0.3.1 §5.3, §9.4.
Provides rerank.
"""

import logging

from app.schemas.search import SearchResultItem

logger = logging.getLogger("app.services.reranking_service")


def rerank(query: str, results: list[SearchResultItem]) -> list[SearchResultItem]:
    """Rerank search results based on query relevance per CONTRACT §9.4."""
    if not results:
        return []

    terms = [t.lower() for t in query.split() if len(t) > 1]
    if not terms:
        return results

    scored_results: list[tuple[float, SearchResultItem]] = []
    for item in results:
        title_lower = item.title.lower()
        excerpt_lower = item.excerpt.lower()

        # Score fusion: title matches weigh 2x, excerpt matches weigh 1x
        title_hits = sum(1 for t in terms if t in title_lower)
        excerpt_hits = sum(1 for t in terms if t in excerpt_lower)
        term_score = (title_hits * 2.0 + excerpt_hits * 1.0) / (len(terms) * 3.0)

        # Combined with original score
        new_score = round(0.5 * item.score + 0.5 * term_score, 4)

        reranked_item = SearchResultItem(
            note_id=item.note_id,
            chunk_id=item.chunk_id,
            title=item.title,
            excerpt=item.excerpt,
            score=new_score,
            score_meaning="reranked_fusion",
            search_mode=item.search_mode,
            is_archived=item.is_archived,
        )
        scored_results.append((new_score, reranked_item))

    scored_results.sort(key=lambda x: x[0], reverse=True)
    return [r[1] for r in scored_results]
