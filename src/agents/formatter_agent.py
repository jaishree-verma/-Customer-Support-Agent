from pathlib import Path

from langchain_core.prompts import PromptTemplate

from src.constants import BASE_DIR
from src.llm_config import LLM
from src.models import AgentState
from src.utils.common import read_txt


class FormatterAgent:
    """
    Agent responsible for formatting and polishing the final answer report.
    """

    def __init__(self):
        self.llm = LLM
        try:
            raw_prompt = read_txt(Path(BASE_DIR) / "prompts" / "formatter_agent_prompt.txt")
            self.prompt_template = PromptTemplate(
                template=raw_prompt,
                input_variables=[{"final_answer_draft": "final_answer_draft"}],
            )
        except Exception:
            self.prompt_template = None

    def run(self, state: AgentState) -> AgentState:
        """
        Formats the final answer draft into a polished report.
        """
        print("---FORMATTER AGENT: Formatting final report---")

        final_answer_draft = state.get("final_answer_draft", "")
        report_formatted = final_answer_draft

        if self.llm and self.prompt_template:
            try:
                chain = self.prompt_template | self.llm
                response = chain.invoke({"final_answer_draft": final_answer_draft})
                report_formatted = response.content
            except Exception as e:
                print(f"---FORMATTER AGENT notice: Gemini LLM formatting skipped ({e}). Using draft report.---")

        print("---FORMATTER AGENT: Final Report Formatted. Workflow END.---")

        return {
            **state,
            "report_formatted": report_formatted,
            "next_agent_to_call": "END",
        }
