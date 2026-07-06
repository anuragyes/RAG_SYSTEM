"""
Configuration for the AI Service.
Modify these values based on your hardware and model preferences.
"""
import os
from pathlib import Path

# --- Ollama Configuration ---
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.1:8b")  # Or "qwen2:7b", "phi3:mini"
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")

# --- ChromaDB Configuration ---
BASE_DIR = Path(__file__).resolve().parent
CHROMA_DB_PATH = str(BASE_DIR / "data" / "chroma_db")
CHROMA_COLLECTION_NAME = "government_schemes"

# --- Document Processing ---
CHUNK_SIZE = 1000  # Characters per chunk
CHUNK_OVERLAP = 200  # Overlap between chunks
UPLOAD_DIR = str(BASE_DIR / "uploads")

# --- RAG Configuration ---
TOP_K_RESULTS = 5  # Number of relevant chunks to retrieve
TEMPERATURE = 0.2  # LLM temperature (lower = more factual)

# --- System Prompt ---
SYSTEM_PROMPT = """You are an expert Indian Government Scheme Eligibility Navigator.
Your job is to help citizens discover government schemes they qualify for.

RULES:
1. ONLY use information from the provided context documents.
2. ALWAYS cite the source document for every claim you make.
3. If you don't know or the context doesn't contain relevant info, say so honestly.
4. Be empathetic and use simple language a common citizen can understand.
5. Structure your response with clear headings and bullet points.
6. When listing schemes, include: Scheme Name, Benefits, Eligibility Criteria, How to Apply.
7. You can respond in Hindi if the user asks in Hindi.

FORMAT:
- Use **bold** for scheme names
- Use bullet points for eligibility criteria
- Always end with "📄 Sources:" listing the documents you referenced
"""

# Ensure directories exist
os.makedirs(CHROMA_DB_PATH, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
