from pathlib import Path
from typing import List

from langchain_core.prompts import PromptTemplate
from langchain_core.documents import Document

from src.constants import BASE_DIR
from src.llm_config import LLM
from src.models import AgentState
from src.utils.common import read_txt


class SynthesizerAgent:
    """
    Agent responsible for synthesizing a draft answer from accumulated relevant chunks.
    """

    def __init__(self):
        self.llm = LLM
        try:
            raw_prompt = read_txt(
                Path(BASE_DIR) / "prompts" / "synthesizer_agent_prompt.txt"
            )
            self.prompt_template = PromptTemplate(
                template=raw_prompt,
                input_variables=[
                    {
                        "original_query": "original_query",
                        "accumulated_relevant_chunks_content": "accumulated_relevant_chunks_content",
                        "unanswerable_sub_queries_str": "unanswerable_sub_queries_str",
                    }
                ],
            )
        except Exception:
            self.prompt_template = None

    def run(self, state: AgentState) -> AgentState:
        """
        Synthesizes the answer draft from accumulated relevant chunks.
        """
        print("---SYNTHESIZER AGENT: Generating answer draft---")

        original_query = state.get("original_query", "")
        accumulated_relevant_chunks: List[Document] = state.get(
            "accumulated_relevant_chunks", []
        )
        unanswerable_sub_queries: List[str] = state.get("unanswerable_sub_queries", [])

        if not accumulated_relevant_chunks:
            final_answer_draft = (
                f"I could not find sufficient information in the knowledge base to answer your query: '{original_query}'."
            )
            if unanswerable_sub_queries:
                final_answer_draft += f" (Specifically, could not answer: {', '.join(unanswerable_sub_queries)})"
        else:
            accumulated_relevant_chunks_content = "\n\n".join(
                [f"### Section\n{chunk.page_content}" for chunk in accumulated_relevant_chunks]
            )
            unanswerable_sub_queries_str = (
                "\n".join([f"- {sq}" for sq in unanswerable_sub_queries])
                if unanswerable_sub_queries
                else "None"
            )

            # 1. Try Gemini LLM synthesis first
            synthesized_with_llm = False
            if self.llm and self.prompt_template:
                try:
                    chain = self.prompt_template | self.llm
                    response = chain.invoke(
                        {
                            "original_query": original_query,
                            "accumulated_relevant_chunks_content": accumulated_relevant_chunks_content,
                            "unanswerable_sub_queries_str": unanswerable_sub_queries_str,
                        }
                    )
                    final_answer_draft = response.content
                    synthesized_with_llm = True
                except Exception as e:
                    print(f"---SYNTHESIZER AGENT notice: Gemini LLM call skipped ({e}). Formatting directly from documents.---")

            # 2. Keyless fallback: format directly from accumulated document chunks
            if not synthesized_with_llm:
                final_answer_draft = (
                    f"## Support Resolution for: \"{original_query}\"\n\n"
                    f"Based on the official product knowledge base documentation:\n\n"
                    f"{accumulated_relevant_chunks_content}\n\n"
                    f"*Note: Configure a valid `GEMINI_API_KEY` in `.env` for AI-synthesized summaries.*"
                )

        print("---SYNTHESIZER AGENT: Draft Answer Generated. Moving to formatting.---")

        return {
            **state,
            "final_answer_draft": final_answer_draft,
            "next_agent_to_call": "formatter_agent",
        }
