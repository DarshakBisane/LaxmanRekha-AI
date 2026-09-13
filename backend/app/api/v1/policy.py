from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.schemas.case import PolicySnippet
from app.services.rag_service import rag_service
from app.api.deps import get_current_user
from app.db.models import User

router = APIRouter(prefix="/policy", tags=["Policy"])

class PolicySearchRequest(BaseModel):
    query: str
    top_k: int = 4

@router.post("/search", response_model=List[PolicySnippet], summary="Query RAG policy knowledge base")
def search_policy(
    payload: PolicySearchRequest,
    current_user: User = Depends(get_current_user)
):
    results = rag_service.search_policy(payload.query, top_k=payload.top_k)
    return [
        PolicySnippet(
            filename=r["filename"],
            section=r["section"],
            guidance=r["guidance"],
            relevance_score=r.get("relevance_score")
        ) for r in results
    ]
