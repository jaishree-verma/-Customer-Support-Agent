import os
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredMarkdownLoader,
)
from langchain_chroma import Chroma

from src.constants import BASE_DIR
from src.llm_config import EMBEDDINGS
from src.utils.common import create_directories, read_json, save_json


def build_knowledge_base(
    raw_data_path: str, collection_name: str, chroma_db_dir: str, mainfest_path: str
):
    if not os.path.exists(raw_data_path):
        raise ValueError(f"Data directory {raw_data_path} does not exist.")

    create_directories([Path.joinpath(BASE_DIR, chroma_db_dir)])

    manifest = read_json(Path.joinpath(BASE_DIR, mainfest_path))
    updated_manifest = manifest.copy()

    documents = []
    supported_extensions = {
        ".pdf": PyPDFLoader,
        ".txt": TextLoader,
        ".md": UnstructuredMarkdownLoader,
    }

    for root, _, files in os.walk(raw_data_path):
        for file in files:
            file_path = os.path.join(root, file)
            extension = os.path.splitext(file_path)[1]

            if file in updated_manifest or file_path in updated_manifest:
                print(f"Skipping already processed file: {file}")
                continue

            if extension in supported_extensions:
                loader = supported_extensions[extension](file_path)
                file_docs = loader.load()
                updated_manifest[file] = True
                documents.extend(file_docs)
                print(f"Loaded {len(file_docs)} pages from {file}")
            else:
                print(f"Skipping unsupported file type: {file}")

    if not documents:
        print("No documents loaded or all documents already processed in manifest.")
        return

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    texts = text_splitter.split_documents(documents)
    try:
        db = Chroma.from_documents(
            texts,
            EMBEDDINGS,
            persist_directory=chroma_db_dir,
            collection_name=collection_name,
        )
        save_json(updated_manifest, Path.joinpath(BASE_DIR, mainfest_path))
        print("Knowledge base built and manifest updated successfully.")
    except Exception as e:
        print(f"Error creating vector database: {e}")
