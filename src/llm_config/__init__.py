import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

load_dotenv()

from src.config import ConfigurationManager

config = ConfigurationManager()
llm_config = config.get_llm_config()

EMBEDDING_MODEL = llm_config.get("EMBEDDING_MODEL", "models/text-embedding-004")
GENERATION_MODEL = llm_config.get("GENERATION_MODEL", "gemini-2.0-flash")
LLM_TEMPERATURE = llm_config.get("LLM_TEMPERATURE", 0.2)
GOOGLE_API_KEY = (
    os.getenv("GEMINI_API_KEY")
    or os.getenv("GOOGLE_API_KEY")
    or llm_config.get("GEMINI_API_KEY")
    or "dummy_api_key_for_initialization"
)


def get_gemini_llm():
    """Initializes and returns the Google Gemini LLM."""
    api_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or GOOGLE_API_KEY
    )
    return ChatGoogleGenerativeAI(
        model=GENERATION_MODEL,
        temperature=LLM_TEMPERATURE,
        google_api_key=api_key if api_key != "YOUR_API_KEY_HERE" else "dummy_key",
    )


def get_gemini_embeddings():
    """Initializes and returns the Google Gemini Embeddings model."""
    api_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or GOOGLE_API_KEY
    )
    return GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=api_key if api_key != "YOUR_API_KEY_HERE" else "dummy_key",
    )


try:
    LLM = get_gemini_llm()
    EMBEDDINGS = get_gemini_embeddings()
except Exception as e:
    print(f"Warning initializing LLM/Embeddings: {e}")
    LLM = None
    EMBEDDINGS = None
