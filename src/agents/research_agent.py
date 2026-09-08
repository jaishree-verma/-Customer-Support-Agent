import json
import re
from pathlib import Path

from langchain_core.prompts import PromptTemplate

from src.constants import BASE_DIR
from src.llm_config import LLM
from src.models import AgentState
from src.utils.common import read_txt


class ResearchAgent:
    """
    Agent responsible for breaking down the original query into sub-queries
    and managing the flow of processing them.
    """

    def __init__(self):
        self.llm = LLM
        raw_prompt = read_txt(Path(BASE_DIR) / "prompts" / "research_agent_prompt.txt")
        self.prompt_template = PromptTemplate(
            template=raw_prompt, input_variables=["original_query"]
        )

    def run(self, state: AgentState) -> AgentState:
        """
        Breaks down the original query into sub-queries or
        prepares the next sub-query for processing.
        """
        print("---RESEARCH AGENT: Managing research plan---")

        original_query = state.get("original_query", "")
        print(f"---RESEARCH AGENT: Original Query: {original_query}---")
        sub_queries_list = state.get("sub_queries_list", [])
        current_sub_query_index = state.get("current_sub_query_index", 0)
        accumulated_relevant_chunks = state.get("accumulated_relevant_chunks", [])
        unanswerable_sub_queries = state.get("unanswerable_sub_queries", [])

        if not sub_queries_list:
            print("---RESEARCH AGENT: Generating sub-queries for original query---")
            try:
                if self.llm is None:
                    raise ValueError("LLM is not configured properly.")

                chain = self.prompt_template | self.llm
                response = chain.invoke({"original_query": original_query})
                try:
                    cleaned_content = re.sub(
                        r"^```(?:json)?\s*|\s*```$",
                        "",
                        response.content.strip(),
                        flags=re.MULTILINE,
                    )
                    new_sub_queries = json.loads(cleaned_content)

                    if not isinstance(new_sub_queries, list):
                        raise ValueError("LLM response is not a JSON list.")

                    sub_queries_list = [
                        sq.strip() for sq in new_sub_queries if sq.strip()
                    ]
                    if not sub_queries_list:
                        raise ValueError("LLM generated an empty list of sub-queries.")
                except (json.JSONDecodeError, ValueError, AttributeError) as e:
                    print(
                        f"---WARNING: Could not parse JSON sub-queries: {e}. Using original query."
                    )
                    sub_queries_list = [original_query]

            except Exception as e:
                print(
                    f"---ERROR: Research agent failed to generate sub-queries: {e}---"
                )
                sub_queries_list = [original_query]

            # ALWAYS ensure state has sub_queries_list set to prevent infinite loop
            current_sub_query_index = 0
            current_sub_query = sub_queries_list[0]
            return {
                **state,
                "sub_queries_list": sub_queries_list,
                "current_sub_query_index": 0,
                "current_sub_query": current_sub_query,
                "retrieval_attempts": 0,
                "retrieved_chunks": [],
                "evaluated_sufficiency": False,
                "evaluator_feedback": "",
                "next_agent_to_call": "retriever_agent",
            }

        if current_sub_query_index >= len(sub_queries_list):
            print(
                "---RESEARCH AGENT: All sub-queries processed. Moving to synthesis.---"
            )
            return {
                **state,
                "next_agent_to_call": "synthesizer_agent",
                "sub_queries_list": sub_queries_list,
                "current_sub_query_index": current_sub_query_index,
                "accumulated_relevant_chunks": accumulated_relevant_chunks,
                "unanswerable_sub_queries": unanswerable_sub_queries,
            }

        current_sub_query = sub_queries_list[current_sub_query_index]
        print(
            f"---RESEARCH AGENT: Processing sub-query {current_sub_query_index + 1}/{len(sub_queries_list)}: '{current_sub_query}'---"
        )

        return {
            **state,
            "sub_queries_list": sub_queries_list,
            "current_sub_query_index": current_sub_query_index,
            "current_sub_query": current_sub_query,
            "retrieval_attempts": 0,
            "retrieved_chunks": [],
            "evaluated_sufficiency": False,
            "evaluator_feedback": "",
            "next_agent_to_call": "retriever_agent",
        }
