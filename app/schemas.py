import uuid
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))


class SourceChunk(BaseModel):
    page_content: str
    metadata: Dict[str, Any] = {}
    source_name: Optional[str] = None


class AgentStepEvent(BaseModel):
    type: str  # e.g., 'AGENT_START', 'SUB_QUERIES_GENERATED', 'RETRIEVAL_COMPLETE', 'EVALUATION_STATUS', 'FINAL_RESPONSE', 'ERROR'
    agent: Optional[str] = None
    sub_queries: Optional[List[str]] = None
    sources: Optional[List[SourceChunk]] = None
    evaluation_status: Optional[str] = None  # 'APPROVED' | 'RETRY'
    feedback: Optional[str] = None
    retrieval_attempts: Optional[int] = None
    content: Optional[str] = None
    state_snapshot: Optional[Dict[str, Any]] = None
