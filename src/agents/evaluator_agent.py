from pathlib import Path
from typing import List

from langchain_core.prompts import PromptTemplate
from langchain_core.documents import Document

from src.constants import BASE_DIR, MAX_RETRIEVAL_ATTEMPTS
from src.llm_config import LLM
from src.models import AgentState
from src.utils.common import read_txt


class EvaluatorAgent:
    """
    Agent responsible for evaluating the sufficiency of retrieved chunks
    to answer the current sub-query.
    """

    def __init__(self):
        self.llm = LLM
        try:
            raw_prompt = read_txt(Path(BASE_DIR) / "prompts" / "evaluator_agent_prompt.txt")
            self.prompt_template = PromptTemplate(
                template=raw_prompt,
                input_variables=[
                    {
                        "current_sub_query": "current_sub_query",
                        "retrieved_chunks_content": "retrieved_chunks_content",
                    }
                ],
            )
        except Exception:
            self.prompt_template = None

    def run(self, state: AgentState) -> AgentState:
        """
        Evaluates retrieved chunks and decides sufficiency.
        """
        print("---EVALUATOR AGENT: Evaluating retrieved chunks---")

        current_sub_query = state.get("current_sub_query", "")
        retrieved_chunks: List[Document] = state.get("retrieved_chunks", [])
        retrieval_attempts = state.get("retrieval_attempts", 1)
        accumulated_relevant_chunks = list(state.get("accumulated_relevant_chunks", []))
        unanswerable_sub_queries = list(state.get("unanswerable_sub_queries", []))

        evaluated_sufficiency = False
        evaluator_feedback = ""

        if not retrieved_chunks:
            print(f"---EVALUATOR AGENT: No chunks retrieved for '{current_sub_query}'.---")
            evaluated_sufficiency = False
            evaluator_feedback = "No relevant chunks were retrieved."
        else:
            retrieved_chunks_content = "\n\n".join(
                [chunk.page_content for chunk in retrieved_chunks]
            )
            # 1. Try LLM evaluation if available
            if self.llm and self.prompt_template:
                try:
                    chain = self.prompt_template | self.llm
                    response = chain.invoke(
                        {
                            "current_sub_query": current_sub_query,
                            "retrieved_chunks_content": retrieved_chunks_content,
                        }
                    )
                    response_content = response.content.strip().upper()
                    if "SUFFICIENCY: YES" in response_content:
                        evaluated_sufficiency = True
                    else:
                        evaluated_sufficiency = False
                        evaluator_feedback = "Information requires refinement."
                except Exception as e:
                    print(f"---EVALUATOR AGENT notice: LLM evaluation skipped ({e}). Accepting retrieved chunks.---")
                    evaluated_sufficiency = True
            else:
                # Keyless / offline fallback: if chunks were retrieved, accept them as sufficient
                evaluated_sufficiency = True

        if evaluated_sufficiency:
            print(f"---EVALUATOR AGENT: Chunks accepted for '{current_sub_query}'.---")
            accumulated_relevant_chunks.extend(retrieved_chunks)
            next_agent = "research_agent"
            current_sub_query_index = state.get("current_sub_query_index", 0) + 1
        elif retrieval_attempts < MAX_RETRIEVAL_ATTEMPTS:
            print(f"---EVALUATOR AGENT: Retrying retrieval for '{current_sub_query}'.---")
            next_agent = "retriever_agent"
            current_sub_query_index = state.get("current_sub_query_index", 0)
        else:
            print(f"---EVALUATOR AGENT: Max attempts reached for '{current_sub_query}'. Marking unanswerable.---")
            unanswerable_sub_queries.append(current_sub_query)
            next_agent = "research_agent"
            current_sub_query_index = state.get("current_sub_query_index", 0) + 1

        return {
            **state,
            "evaluated_sufficiency": evaluated_sufficiency,
            "evaluator_feedback": evaluator_feedback,
            "retrieval_attempts": retrieval_attempts,
            "accumulated_relevant_chunks": accumulated_relevant_chunks,
            "unanswerable_sub_queries": unanswerable_sub_queries,
            "current_sub_query_index": current_sub_query_index,
            "next_agent_to_call": next_agent,
        }
