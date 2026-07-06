"""
Document Processing Pipeline
Handles PDF parsing for both digital and scanned documents.
- Digital PDFs: PyMuPDF for fast text extraction
- Scanned PDFs: Falls back to OCR (PaddleOCR when available)
- Output: Clean text chunks with metadata for vector storage
"""
import os
import fitz  # PyMuPDF
from pathlib import Path
from langchain.text_splitter import RecursiveCharacterTextSplitter
from config import CHUNK_SIZE, CHUNK_OVERLAP


def detect_pdf_type(pdf_path: str) -> str:
    """Detect if a PDF is digital (has selectable text) or scanned (image-only)."""
    doc = fitz.open(pdf_path)
    total_text_length = 0
    for page in doc:
        total_text_length += len(page.get_text().strip())
    doc.close()

    if total_text_length < 50:
        return "scanned"
    return "digital"


def extract_text_from_digital_pdf(pdf_path: str) -> list[dict]:
    """Extract text from a digital PDF using PyMuPDF."""
    doc = fitz.open(pdf_path)
    pages = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text")
        if text.strip():
            pages.append({
                "text": text.strip(),
                "metadata": {
                    "source": os.path.basename(pdf_path),
                    "page": page_num,
                    "total_pages": len(doc),
                    "type": "digital_pdf"
                }
            })
    doc.close()
    return pages


def extract_text_from_scanned_pdf(pdf_path: str) -> list[dict]:
    """
    Extract text from scanned PDF using OCR.
    Falls back to basic PyMuPDF extraction if OCR tools aren't available.
    """
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang='hi')  # Hindi + English
        doc = fitz.open(pdf_path)
        pages = []
        for page_num, page in enumerate(doc, start=1):
            # Convert page to image
            pix = page.get_pixmap(dpi=300)
            img_path = f"/tmp/page_{page_num}.png"
            pix.save(img_path)

            # Run OCR
            result = ocr.ocr(img_path, cls=True)
            text_lines = []
            if result and result[0]:
                for line in result[0]:
                    text_lines.append(line[1][0])

            if text_lines:
                pages.append({
                    "text": "\n".join(text_lines),
                    "metadata": {
                        "source": os.path.basename(pdf_path),
                        "page": page_num,
                        "total_pages": len(doc),
                        "type": "scanned_pdf_ocr"
                    }
                })
            os.remove(img_path)
        doc.close()
        return pages

    except ImportError:
        print("PaddleOCR not available. Using basic PyMuPDF extraction for scanned PDF.")
        return extract_text_from_digital_pdf(pdf_path)


def extract_text_from_markdown(file_path: str) -> list[dict]:
    """Extract text from a Markdown or plain text file."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    return [{
        "text": content,
        "metadata": {
            "source": os.path.basename(file_path),
            "page": 1,
            "total_pages": 1,
            "type": "markdown"
        }
    }]


def chunk_documents(pages: list[dict]) -> list[dict]:
    """Split extracted pages into smaller chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = []
    for page in pages:
        splits = splitter.split_text(page["text"])
        for i, split in enumerate(splits):
            chunks.append({
                "text": split,
                "metadata": {
                    **page["metadata"],
                    "chunk_index": i,
                    "total_chunks_in_page": len(splits)
                }
            })
    return chunks


def process_document(file_path: str) -> list[dict]:
    """
    Main entry point: Process any document and return chunks ready for embedding.
    Supports: PDF (digital + scanned), Markdown (.md), Text (.txt)
    """
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        pdf_type = detect_pdf_type(file_path)
        print(f"Detected PDF type: {pdf_type} for {file_path}")
        if pdf_type == "scanned":
            pages = extract_text_from_scanned_pdf(file_path)
        else:
            pages = extract_text_from_digital_pdf(file_path)
    elif ext in [".md", ".txt"]:
        pages = extract_text_from_markdown(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    chunks = chunk_documents(pages)
    print(f"Processed {file_path}: {len(pages)} pages → {len(chunks)} chunks")
    return chunks
