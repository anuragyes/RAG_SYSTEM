import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const UploadPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    const allowed = ['.pdf', '.md', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Unsupported file type: ${ext}. Allowed: PDF, MD, TXT`);
      return;
    }

    setUploading(true);
    setProgress(10);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('document', file);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 85));
    }, 500);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setProgress(100);
      setResult(data);
    } catch (err) {
      setError('Upload failed. Make sure the backend server is running.');
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="page-content">
      <div className="explorer-header">
        <h1>📄 Upload Government Documents</h1>
        <p>Upload government scheme PDFs, circulars, or notifications. The AI will parse, index, and make them searchable via chat.</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragOver ? 'dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon">
          <Upload size={28} />
        </div>
        <h3>Drop your document here</h3>
        <p>or click to browse files</p>
        <div className="upload-hint">
          Supported: PDF, Markdown (.md), Text (.txt) • Max 20MB
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.md,.txt"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {/* Progress */}
      {uploading && (
        <div className="upload-progress">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span>Processing document...</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <CheckCircle size={24} style={{ color: 'var(--accent-emerald)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Upload Successful!</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {result.message}
          </p>
          {result.file && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />
              {result.file.originalName} ({(result.file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem', borderColor: 'rgba(244,63,94,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} style={{ color: 'var(--accent-rose)' }} />
            <span style={{ color: 'var(--accent-rose)', fontSize: '0.9rem' }}>{error}</span>
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="features-grid" style={{ marginTop: '2.5rem' }}>
        <div className="feature-card">
          <div className="feature-icon purple"><FileText size={22} /></div>
          <h3>Digital PDFs</h3>
          <p>PyMuPDF extracts text instantly from digitally-generated PDF documents with full fidelity.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon cyan">🔍</div>
          <h3>Scanned Documents</h3>
          <p>PaddleOCR handles scanned documents including Hindi/Devanagari text with deep learning accuracy.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon emerald">📊</div>
          <h3>Tables & Layouts</h3>
          <p>Docling preserves complex document structures — tables, multi-column text, and headings.</p>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
