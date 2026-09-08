import os
import json
import asyncio
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

load_dotenv()

from src.graph.agent_workflow import create_rag_agent_workflow
from src.models import AgentState
from src.config import ConfigurationManager
from app.schemas import ChatRequest

rag_app = create_rag_agent_workflow()

app = FastAPI(
    title="RAG Agent Network API",
    version="2.0.0",
    description="Multi-Agent Customer Support Network Powered by LangGraph & Gemini",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def format_source_chunks(chunks):
    sources = []
    if not chunks:
        return sources
    for idx, doc in enumerate(chunks):
        content = getattr(doc, "page_content", str(doc))
        metadata = getattr(doc, "metadata", {})
        source_name = metadata.get("source", metadata.get("file_name", f"Knowledge Document #{idx+1}"))
        sources.append({
            "page_content": content,
            "metadata": metadata,
            "source_name": os.path.basename(str(source_name)),
        })
    return sources


async def sse_event_generator(query: str, session_id: str) -> AsyncGenerator[str, None]:
    """
    Streams LangGraph agent updates as Server-Sent Events (SSE).
    """
    initial_state: AgentState = {
        "original_query": query,
        "sub_queries_list": [],
        "current_sub_query_index": 0,
        "current_sub_query": "",
        "retrieved_chunks": [],
        "evaluated_sufficiency": False,
        "evaluator_feedback": "",
        "retrieval_attempts": 0,
        "accumulated_relevant_chunks": [],
        "unanswerable_sub_queries": [],
        "final_answer_draft": "",
        "report_formatted": "",
        "next_agent_to_call": "research_agent",
    }

    start_payload = {
        "type": "AGENT_START",
        "agent": "supervisor",
        "content": f"Initializing multi-agent workflow for query: '{query}'",
        "session_id": session_id,
    }
    yield f"data: {json.dumps(start_payload)}\n\n"
    await asyncio.sleep(0.05)

    accumulated_sources = []
    final_text = ""

    try:
        # Stream workflow node updates using LangGraph's astream
        async for output in rag_app.astream(initial_state, config={"recursion_limit": 30}):
            for node_name, state in output.items():
                event_data = {
                    "type": "NODE_UPDATE",
                    "agent": node_name,
                    "state_snapshot": {
                        "current_sub_query": state.get("current_sub_query", ""),
                        "sub_queries_list": state.get("sub_queries_list", []),
                        "current_sub_query_index": state.get("current_sub_query_index", 0),
                        "retrieval_attempts": state.get("retrieval_attempts", 0),
                        "evaluated_sufficiency": state.get("evaluated_sufficiency", False),
                        "evaluator_feedback": state.get("evaluator_feedback", ""),
                        "next_agent_to_call": state.get("next_agent_to_call", ""),
                    }
                }

                if node_name == "research_agent":
                    event_data["type"] = "SUB_QUERIES_GENERATED"
                    sub_list = state.get("sub_queries_list", [])
                    event_data["sub_queries"] = sub_list
                    event_data["content"] = f"Research Agent: Planned {len(sub_list)} research sub-queries."

                elif node_name == "retriever_agent":
                    event_data["type"] = "RETRIEVAL_COMPLETE"
                    chunks = state.get("retrieved_chunks", [])
                    event_data["sources"] = format_source_chunks(chunks)
                    event_data["content"] = f"Retriever Agent: Fetched {len(chunks)} chunks for '{state.get('current_sub_query', '')}'"

                elif node_name == "evaluator_agent":
                    event_data["type"] = "EVALUATION_STATUS"
                    is_sufficient = state.get("evaluated_sufficiency", False)
                    event_data["evaluation_status"] = "APPROVED" if is_sufficient else "RETRY"
                    event_data["feedback"] = state.get("evaluator_feedback", "")
                    event_data["retrieval_attempts"] = state.get("retrieval_attempts", 0)
                    event_data["content"] = f"Evaluator Agent: {'Approved document context' if is_sufficient else 'Context insufficient, retrying retrieval'}"

                elif node_name == "synthesizer_agent":
                    event_data["type"] = "SYNTHESIS_COMPLETE"
                    event_data["content"] = "Synthesizer Agent: Drafted grounded response."
                    all_chunks = state.get("accumulated_relevant_chunks", [])
                    accumulated_sources = format_source_chunks(all_chunks)

                elif node_name == "formatter_agent":
                    event_data["type"] = "FINAL_RESPONSE"
                    final_text = state.get("report_formatted", "")
                    event_data["content"] = final_text
                    event_data["sources"] = accumulated_sources

                yield f"data: {json.dumps(event_data)}\n\n"
                await asyncio.sleep(0.05)

        complete_payload = {
            "type": "WORKFLOW_COMPLETE",
            "agent": "END",
            "content": "RAG Agent Network workflow completed successfully.",
            "sources": accumulated_sources,
        }
        yield f"data: {json.dumps(complete_payload)}\n\n"

    except Exception as e:
        error_msg = str(e)
        if "recursion_limit" in error_msg.lower():
            fallback_text = (
                "Workflow safety limit reached. To get live model answers, please ensure a valid Google Gemini API key is configured in your `.env` file (`GEMINI_API_KEY=AIzaSy...`)."
            )
        else:
            fallback_text = f"Workflow notice: {error_msg}"

        error_payload = {
            "type": "FINAL_RESPONSE",
            "agent": "formatter_agent",
            "content": fallback_text,
            "sources": accumulated_sources,
        }
        yield f"data: {json.dumps(error_payload)}\n\n"

        complete_payload = {
            "type": "WORKFLOW_COMPLETE",
            "agent": "END",
            "content": "Completed with notification.",
        }
        yield f"data: {json.dumps(complete_payload)}\n\n"


@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    return StreamingResponse(
        sse_event_generator(request.message, request.session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/chat")
async def chat_sync_endpoint(request: ChatRequest):
    initial_state: AgentState = {
        "original_query": request.message,
        "sub_queries_list": [],
        "current_sub_query_index": 0,
        "current_sub_query": "",
        "retrieved_chunks": [],
        "evaluated_sufficiency": False,
        "evaluator_feedback": "",
        "retrieval_attempts": 0,
        "accumulated_relevant_chunks": [],
        "unanswerable_sub_queries": [],
        "final_answer_draft": "",
        "report_formatted": "",
        "next_agent_to_call": "research_agent",
    }

    try:
        final_state = rag_app.invoke(initial_state, config={"recursion_limit": 30})
        sources = format_source_chunks(final_state.get("accumulated_relevant_chunks", []))
        return {
            "session_id": request.session_id,
            "answer": final_state.get("report_formatted", "No response generated."),
            "sources": sources,
            "unanswerable_sub_queries": final_state.get("unanswerable_sub_queries", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing agent workflow: {str(e)}")


@app.get("/api/health")
@app.get("/health")
async def health_check():
    config = ConfigurationManager()
    kb_config = config.get_knowledge_base_config()
    chroma_dir = kb_config.get("CHROMA_DB_DIR", "")
    kb_exists = os.path.exists(chroma_dir) and bool(os.listdir(chroma_dir)) if os.path.exists(chroma_dir) else False

    return {
        "status": "online",
        "service": "RAG Assistant Network API",
        "vector_db_online": kb_exists,
        "graph_active": True,
        "model": "Google Gemini 2.5/Flash",
    }


@app.get("/")
async def root():
    return {
        "service": "Customer Support Agent API",
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health",
        "version": "2.0.0",
    }
