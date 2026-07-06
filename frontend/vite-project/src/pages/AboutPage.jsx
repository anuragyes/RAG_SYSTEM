import React from 'react';
import { ExternalLink } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="page-content">
      <div className="explorer-header">
        <h1>ℹ️ About This Project</h1>
        <p>An AI-powered RAG system to help Indian citizens discover government schemes they qualify for.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '1rem' }}>🏗️ Architecture</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          This project uses a <strong>hybrid microservice architecture</strong> with a Node.js API gateway
          and a Python AI engine. The system is designed to be 100% open-source with zero API costs.
        </p>
        <div className="features-grid" style={{ marginTop: '1.5rem' }}>
          <div className="feature-card">
            <h3>🔧 Backend (Node.js)</h3>
            <p>Express.js API gateway with smart local RAG fallback, file upload via Multer, MongoDB for metadata.</p>
          </div>
          <div className="feature-card">
            <h3>🤖 AI Engine (Python)</h3>
            <p>FastAPI + LangChain + Ollama (Llama 3.1) + ChromaDB for production-grade vector RAG pipeline.</p>
          </div>
          <div className="feature-card">
            <h3>🎨 Frontend (React)</h3>
            <p>Vite + React with premium dark theme, glassmorphism UI, markdown rendering, and responsive design.</p>
          </div>
          <div className="feature-card">
            <h3>📄 Document Pipeline</h3>
            <p>PyMuPDF for digital PDFs, PaddleOCR for scanned Hindi documents, Docling for layout analysis.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '1rem' }}>📚 Tech Stack</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { name: 'React + Vite', desc: 'Frontend' },
            { name: 'Node.js + Express', desc: 'API Gateway' },
            { name: 'Python + FastAPI', desc: 'AI Engine' },
            { name: 'Ollama (Llama 3.1)', desc: 'Local LLM' },
            { name: 'ChromaDB', desc: 'Vector Database' },
            { name: 'LangChain', desc: 'RAG Framework' },
            { name: 'PyMuPDF', desc: 'PDF Parsing' },
            { name: 'PaddleOCR', desc: 'Hindi OCR' },
            { name: 'MongoDB', desc: 'Metadata Store' },
            { name: 'nomic-embed-text', desc: 'Embeddings' },
          ].map((tech, i) => (
            <div key={i} style={{
              padding: '0.75rem 1rem', borderRadius: '10px',
              background: 'var(--gradient-card)', border: '1px solid var(--border-glass)'
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tech.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tech.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '1rem' }}>🚀 Getting Started</h2>
        <ol style={{ color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: '1.25rem' }}>
          <li><strong>Backend:</strong> <code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>cd backend && npm run dev</code></li>
          <li><strong>Frontend:</strong> <code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>cd frontend/vite-project && npm run dev</code></li>
          <li><strong>AI Service (optional):</strong> Install Python, Ollama, then run <code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>cd backend/ai-service && pip install -r requirements.txt && python main.py</code></li>
          <li><strong>Ollama:</strong> <code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>ollama pull llama3.1:8b && ollama pull nomic-embed-text</code></li>
        </ol>
      </div>
    </div>
  );
};

export default AboutPage;
