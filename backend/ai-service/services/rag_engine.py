"""
RAG Engine - The core intelligence of the system.
Handles: Query embedding → Vector search → Context building → LLM response
Uses LangChain with Ollama (local) and ChromaDB for vector storage.
"""
from langchain_ollama import OllamaLLM, OllamaEmbeddings
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain.schema import Document
from config import (
    OLLAMA_BASE_URL, LLM_MODEL, EMBEDDING_MODEL,
    CHROMA_DB_PATH, CHROMA_COLLECTION_NAME,
    TOP_K_RESULTS, TEMPERATURE, SYSTEM_PROMPT
)


# --- Initialize Components (Ollama is a tool that lets you run Large Language Models (LLMs) locally on your own computer instead of using a cloud service. With Ollama, you can download and run models like: Llama 3, Mistral, Gemma, DeepSeek-R1, Qwen Why use Ollama? Runs AI models offline. Your data stays on your computer. No API costs for local inference. Easy integration with Node.js, Python, and web apps. Great for building AI chatbots, RAG systems, and coding assistants.)  function Connects to Ollama's nomic-embed-text model — converts text → 768-dimensional number vectors   ---
def get_embeddings():
    """Get the Ollama embedding model."""
    return OllamaEmbeddings(
        model=EMBEDDING_MODEL,
        base_url=OLLAMA_BASE_URL
    )

  # ----  	Opens ChromaDB (a local vector database stored on disk). This is where all your scheme document chunks live as vectors
def get_vector_store():
    """Get or create the ChromaDB vector store."""
    return Chroma(
        collection_name=CHROMA_COLLECTION_NAME,
        embedding_function=get_embeddings(),
        persist_directory=CHROMA_DB_PATH
    )
#  Connects to Ollama's Llama 3.1 model — the actual AI that writes responses

def get_llm():
    """Get the Ollama LLM."""
    return OllamaLLM(
        model=LLM_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=TEMPERATURE
    )


# --- Ingestion   WRITE operation — Takes processed document chunks and stores them in ChromaDB ---
def ingest_chunks(chunks: list[dict], source_name: str = "unknown") -> int:
    """
    Add document chunks to the vector store.
    Returns the number of chunks added.
    """
    vector_store = get_vector_store()

    documents = []
    for chunk in chunks:
        doc = Document(
            page_content=chunk["text"],
            metadata=chunk["metadata"]
        )
        documents.append(doc)

    if documents:
        vector_store.add_documents(documents)

    return len(documents)


# --- RetrievalBSEARCH operation — Takes a user query, converts it to a vector, finds the 5 most similar chunks in ChromaDB ---
def retrieve_context(query: str, top_k: int = TOP_K_RESULTS) -> list[dict]:
    """
    Search the vector store for relevant document chunks.
    Returns a list of {text, metadata, relevance_score} dicts.
    """
    vector_store = get_vector_store()

    results = vector_store.similarity_search_with_relevance_scores(
        query, k=top_k
    )

    context_items = []
    for doc, score in results:
        context_items.append({
            "text": doc.page_content,
            "metadata": doc.metadata,
            "relevance_score": round(score, 4)
        })

    return context_items

  #   Step 1: retrieve_context(query)
  # → "Am I eligible for PM-KISAN?"
# → Converts to vector [0.23, -0.45, 0.67, ...]
    # → Searches ChromaDB for similar vectors
    # → Returns top 5 matching chunks from scheme documents 

  # Step 2: Build context string
  # → "--- Document 1 (Source: pm_kisan.md, Page 1) ---"
  # → "PM-KISAN provides ₹6,000/year to landholding farmers..."
  # → Also includes user profile (occupation, state, income, etc.)


# Step 3: Create prompt
# → SYSTEM: "You are an expert Government Scheme Navigator..."
# → CONTEXT: [the 5 retrieved document chunks]
# → QUESTION: "Am I eligible for PM-KISAN?"

# Step 4: Call Ollama LLM
# → Llama 3.1 reads the context + question
# → Generates a grounded answer (can only use info from context)
# → Returns response with source citations

# RAG system (retrieve → prompt → generate → cite)
#
#Retrieval (search) ----------------------------------------------------------->
#→ User asks: "Am I eligible for PM-KISAN?"  
#→ Embeddings convert it to numbers: [0.23, -0.45, 0.67, ...]
#→ ChromaDB finds chunks with similar numbers (vector search)
#→ Returns top 5 relevant chunks from PM-KISAN PDF
#
#Prompt engineering ---------------------------------------------------------->
#→ System prompt defines chatbot personality and rules
#→ Context injects the retrieved document chunks
#→ User question is appended
#→ Example template:
#   "You are a government scheme expert. Use ONLY the context below.
#    Context:
#    [Chunk 1: PM-KISAN eligibility...]
#    [Chunk 2: Landholding requirement...]
#    [Chunk 3: Income limits...]
#    Question: Am I eligible for PM-KISAN?"
#
#Generation (LLM) ------------------------------------------------------------>
#→ Llama 3.1 reads the prompt with context
#→ Generates a grounded answer based *only* on the documents
#→ Cannot invent facts (no hallucinations!)
#→ Includes citations linking back to sources
#
#Output --------------------------------------------------------------------->
#→ Reply: "Based on your profile as a small farmer with 2 acres in Karnataka, you appear eligible for PM-KISAN. The scheme provides ₹6,000 annually to landholding farmers. [Source: pm_kisan.md, Page 1]"
#→ Citations: ["pm_kisan.md (Page 1)"]
#
#Why This Is Powerful
#No hallucination — The LLM can only answer from the documents you've fed it
#Citations — Every response tracks which source files were used
#Scalable — Upload more PDFs → they get chunked & embedded → instantly searchable
#Local & private — Everything runs on your machine via Ollama, no data leaves your system


# --- Generation   The main pipeline — Orchestrates the full RAG flow (retrieve → build prompt → call LLM → return with citations) ---
def generate_response(query: str, user_profile: dict = None) -> dict:
    """
    Full RAG pipeline: Retrieve → Build Prompt → Generate → Return with citations.
    """
    # Step 1: Retrieve relevant context
    context_items = retrieve_context(query)

    if not context_items:
        return {
            "reply": "I don't have enough information in my knowledge base to answer your question. Please try uploading relevant government scheme documents first, or rephrase your query.",
            "citations": [],
            "context_used": 0
        }

    # Step 2: Build context string
    context_str = ""
    sources = set()
    for i, item in enumerate(context_items, 1):
        source = item["metadata"].get("source", "Unknown")
        page = item["metadata"].get("page", "?")
        context_str += f"\n--- Document {i} (Source: {source}, Page {page}) ---\n"
        context_str += item["text"] + "\n"
        sources.add(f"{source} (Page {page})")

    # Step 3: Build profile context
    profile_str = ""
    if user_profile:
        profile_parts = []
        if user_profile.get("state"):
            profile_parts.append(f"State: {user_profile['state']}")
        if user_profile.get("occupation"):
            profile_parts.append(f"Occupation: {user_profile['occupation']}")
        if user_profile.get("income"):
            profile_parts.append(f"Annual Income: ₹{user_profile['income']}")
        if user_profile.get("age"):
            profile_parts.append(f"Age: {user_profile['age']}")
        if user_profile.get("gender"):
            profile_parts.append(f"Gender: {user_profile['gender']}")
        if user_profile.get("category"):
            profile_parts.append(f"Category: {user_profile['category']}")
        if profile_parts:
            profile_str = "\n\nUser Profile:\n" + "\n".join(profile_parts)

    # Step 4: Create prompt
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", """Based on the following government scheme documents, answer the user's question.

CONTEXT DOCUMENTS:
{context}
{profile}

USER QUESTION: {query}

Remember to cite specific documents and be accurate. If the context doesn't contain enough information, say so.""")
    ])

    prompt = prompt_template.format_messages(
        context=context_str,
        profile=profile_str,
        query=query
    )

    # Step 5: Generate response
    llm = get_llm()
    response = llm.invoke(prompt)

    return {
        "reply": response,
        "citations": list(sources),
        "context_used": len(context_items),
        "relevance_scores": [item["relevance_score"] for item in context_items]
    }


# --- Utility ---
def get_indexed_documents() -> list[str]:
    """Get a list of all unique source documents in the vector store."""
    vector_store = get_vector_store()
    collection = vector_store._collection

    if collection.count() == 0:
        return []

    results = collection.get(include=["metadatas"])
    sources = set()
    for meta in results["metadatas"]:
        if meta and "source" in meta:
            sources.add(meta["source"])

    return sorted(list(sources))


def get_collection_stats() -> dict:
    """Get statistics about the vector store."""
    vector_store = get_vector_store()
    collection = vector_store._collection

    return {
        "total_chunks": collection.count(),
        "sources": get_indexed_documents()
    }
