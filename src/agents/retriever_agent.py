import os
from pathlib import Path
from typing import List
from langchain_core.documents import Document

from src.constants import BASE_DIR, DEFAULT_RETRIEVAL_K
from src.models import AgentState
from src.utils.db_utils import get_vector_db


def search_local_data_docs(query: str) -> List[Document]:
    """
    Keyless fallback search that reads files from data/ directory
    and returns relevant document chunks matching query keywords.
    """
    data_dir = Path(BASE_DIR) / "data"
    if not data_dir.exists():
        return []

    query_keywords = set(query.lower().replace("?", "").replace(",", "").split())
    matched_chunks = []

    for root, _, files in os.walk(data_dir):
        for file in files:
            if file.endswith((".txt", ".md")):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        text = f.read()

                    # Split text into sections by double newline
                    sections = [s.strip() for s in text.split("\n\n") if s.strip()]
                    for sec in sections:
                        sec_lower = sec.lower()
                        # Calculate keyword overlap score
                        matches = sum(1 for kw in query_keywords if len(kw) > 2 and kw in sec_lower)
                        if matches > 0:
                            matched_chunks.append((matches, Document(
                                page_content=sec,
                                metadata={"source": file, "file_path": filepath}
                            )))
                except Exception as e:
                    print(f"Error reading file {filepath}: {e}")

    # Sort by relevance match score descending
    matched_chunks.sort(key=lambda x: x[0], reverse=True)
    return [doc for _, doc in matched_chunks[:DEFAULT_RETRIEVAL_K]]


class RetrieverAgent:
    """
    Agent responsible for retrieving relevant chunks from vector DB or local document fallback.
    """

    def __init__(self):
        try:
            self.vector_db = get_vector_db()
            self.retriever = self.vector_db.as_retriever(
                search_kwargs={"k": DEFAULT_RETRIEVAL_K}
            )
        except Exception as e:
            print(f"Vector DB init warning: {e}")
            self.vector_db = None
            self.retriever = None

    def run(self, state: AgentState) -> AgentState:
        """
        Retrieves document chunks based on current sub-query.
        """
        print("---RETRIEVER AGENT: Retrieving information---")
        current_sub_query = state.get("current_sub_query", state.get("original_query", ""))
        retrieval_attempts = state.get("retrieval_attempts", 0) + 1

        print(f"---RETRIEVER AGENT: Attempt {retrieval_attempts} for '{current_sub_query}'---")
        retrieved_chunks: List[Document] = []

        # 1. Try Vector DB retrieval first
        if self.retriever:
            try:
                retrieved_chunks = self.retriever.invoke(current_sub_query)
            except Exception as e:
                print(f"---Vector DB retrieval notice: {e}. Switching to local document search.---")

        # 2. Fallback to local data/ document keyword search if vector DB is empty
        if not retrieved_chunks:
            print(f"---RETRIEVER AGENT: Using local document search for '{current_sub_query}'---")
            retrieved_chunks = search_local_data_docs(current_sub_query)

        print(f"---RETRIEVER AGENT: Found {len(retrieved_chunks)} relevant document chunks---")

        return {
            **state,
            "retrieved_chunks": retrieved_chunks,
            "retrieval_attempts": retrieval_attempts,
            "next_agent_to_call": "evaluator_agent",
        }
