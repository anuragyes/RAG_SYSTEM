"""
FastAPI Application - AI Service Entry Point
Provides REST API for document ingestion and RAG-powered queries.
"""
import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from config import UPLOAD_DIR
from services.document_processor import process_document
from services.rag_engine import (
    ingest_chunks, generate_response,
    get_collection_stats, get_indexed_documents
)

app = FastAPI(
    title="Scheme Navigator AI Service",
    description="RAG-powered Government Scheme Eligibility Engine",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response Models ---
class QueryRequest(BaseModel):
    message: str
    profile: Optional[dict] = None


class QueryResponse(BaseModel):
    reply: str
    citations: list[str]
    context_used: int
    relevance_scores: list[float] = []


class IngestResponse(BaseModel):
    status: str
    filename: str
    chunks_added: int
    message: str


# --- Health Check ---
@app.get("/health")
async def health_check():
    stats = get_collection_stats()
    return {
        "status": "healthy",
        "service": "ai-engine",
        "vector_store": stats
    }


# --- Document Ingestion ---
@app.post("/ingest", response_model=IngestResponse)
async def ingest_document(file: UploadFile = File(...)):
    """Upload and process a PDF/Markdown document into the vector store."""
    # Validate file type
    allowed_types = [".pdf", ".md", ".txt"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {allowed_types}"
        )

    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Process document
        chunks = process_document(file_path)
        # Ingest into vector store
        num_chunks = ingest_chunks(chunks, source_name=file.filename)

        return IngestResponse(
            status="success",
            filename=file.filename,
            chunks_added=num_chunks,
            message=f"Successfully processed and indexed {num_chunks} chunks from {file.filename}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# --- RAG Query ---
@app.post("/query", response_model=QueryResponse)
async def query_schemes(request: QueryRequest):
    """Ask a question about government schemes using RAG."""
    try:
        result = generate_response(
            query=request.message,
            user_profile=request.profile
        )
        return QueryResponse(
            reply=result["reply"],
            citations=result["citations"],
            context_used=result["context_used"],
            relevance_scores=result.get("relevance_scores", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query error: {str(e)}")


# --- List Indexed Schemes ---
@app.get("/schemes")
async def list_schemes():
    """List all indexed documents in the knowledge base."""
    sources = get_indexed_documents()
    stats = get_collection_stats()
    return {
        "documents": sources,
        "total_chunks": stats["total_chunks"],
        "total_documents": len(sources)
    }


# --- Seed Data ---
@app.post("/seed")
async def seed_data():
    """Seed the vector store with pre-loaded scheme documents."""
    data_dir = os.path.join(os.path.dirname(__file__), "data", "schemes")
    if not os.path.exists(data_dir):
        raise HTTPException(status_code=404, detail="No seed data directory found")

    total_chunks = 0
    files_processed = []

    for filename in os.listdir(data_dir):
        file_path = os.path.join(data_dir, filename)
        if os.path.isfile(file_path):
            try:
                chunks = process_document(file_path)
                num = ingest_chunks(chunks, source_name=filename)
                total_chunks += num
                files_processed.append(filename)
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    return {
        "status": "success",
        "files_processed": files_processed,
        "total_chunks": total_chunks,
        "message": f"Seeded {len(files_processed)} documents ({total_chunks} chunks)"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
