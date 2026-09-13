import os
import re
import math
from typing import List, Dict, Any, Optional
from app.core.logging import logger

class RAGPolicyService:
    def __init__(self, knowledge_dir: Optional[str] = None):
        if knowledge_dir is None:
            # Look in project root knowledge/
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            self.knowledge_dir = os.path.join(base_dir, "knowledge")
        else:
            self.knowledge_dir = knowledge_dir
        
        self.chunks: List[Dict[str, Any]] = []
        self._load_and_index_policies()

    def _load_and_index_policies(self):
        self.chunks = []
        if not os.path.exists(self.knowledge_dir):
            logger.warning(f"Knowledge directory not found at: {self.knowledge_dir}")
            return

        for filename in os.listdir(self.knowledge_dir):
            if filename.endswith(".md"):
                filepath = os.path.join(self.knowledge_dir, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    # Split into section chunks by markdown headers
                    sections = re.split(r'\n(?=##?\s+)', content)
                    for sec in sections:
                        sec_text = sec.strip()
                        if not sec_text:
                            continue
                        
                        # Extract title
                        header_match = re.match(r'##?\s+(.+)', sec_text)
                        section_title = header_match.group(1) if header_match else "General Policy"
                        
                        # Tokenize simple terms
                        words = set(re.findall(r'\b[a-zA-Z0-9_\-]{3,}\b', sec_text.lower()))
                        
                        self.chunks.append({
                            "filename": filename,
                            "section": section_title,
                            "guidance": sec_text,
                            "tokens": words
                        })
                except Exception as e:
                    logger.error(f"Error loading policy file {filename}: {e}")

        logger.info(f"RAG Policy Service loaded {len(self.chunks)} policy chunks from {self.knowledge_dir}")

    def search_policy(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves top-k relevant policy guidance chunks for a given case verification query.
        """
        if not self.chunks:
            self._load_and_index_policies()

        if not self.chunks:
            return []

        query_tokens = set(re.findall(r'\b[a-zA-Z0-9_\-]{3,}\b', query.lower()))
        if not query_tokens:
            return []

        scored_chunks = []
        for chunk in self.chunks:
            intersection = query_tokens.intersection(chunk["tokens"])
            if not intersection:
                continue
            
            # Simple BM25-like overlap relevance score
            relevance = len(intersection) / (math.sqrt(len(query_tokens)) * math.sqrt(len(chunk["tokens"])))
            # Priority boost for critical policy keywords
            if any(k in query.lower() for k in ["mismatch", "unresolved", "conflict", "human verification", "discrepancy"]) and \
               any(k in chunk["guidance"].lower() for k in ["mismatch", "unresolved", "conflict", "human verification", "prohibited"]):
                relevance += 0.35

            scored_chunks.append({
                "filename": chunk["filename"],
                "section": chunk["section"],
                "guidance": chunk["guidance"],
                "relevance_score": round(float(relevance), 2)
            })

        scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_chunks[:top_k]

rag_service = RAGPolicyService()
