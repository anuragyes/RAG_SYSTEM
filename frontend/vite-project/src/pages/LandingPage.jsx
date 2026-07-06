import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Upload, Shield, Sparkles, FileText, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="hero-section">
      <div className="hero-badge">
        <Sparkles size={14} />
        AI-Powered • 100% Open Source • 10+ Schemes Indexed
      </div>

      <h1 className="hero-title">
        Discover Government Schemes<br />
        <span className="gradient-text">You Actually Qualify For</span>
      </h1>

      <p className="hero-subtitle">
        Stop scrolling through hundreds of government portals. Tell us about yourself
        in plain language and our AI will instantly find schemes you're eligible for — with
        official citations.
      </p>

      <div className="hero-actions">
        <button className="btn btn-primary" onClick={() => navigate('/chat')}>
          <MessageSquare size={18} />
          Start AI Chat
          <ArrowRight size={16} />
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/explore')}>
          <Search size={18} />
          Browse All Schemes
        </button>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">10+</div>
          <div className="stat-label">Schemes Indexed</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">100%</div>
          <div className="stat-label">Open Source</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">₹0</div>
          <div className="stat-label">API Cost</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">🔒</div>
          <div className="stat-label">Runs Locally</div>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon purple"><MessageSquare size={22} /></div>
          <h3>Natural Language Query</h3>
          <p>Just describe your situation in plain Hindi or English — "I am a farmer in UP with 2 acres" — and get instant scheme matches.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon cyan"><FileText size={22} /></div>
          <h3>RAG-Powered Accuracy</h3>
          <p>Every response is grounded in official government documents. No hallucinations — only cited, verified information.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon emerald"><Upload size={22} /></div>
          <h3>Upload Your Own PDFs</h3>
          <p>Upload government circulars, gazettes, or scheme notifications. Our AI parses them (even scanned Hindi docs via OCR).</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon amber"><Shield size={22} /></div>
          <h3>Privacy First</h3>
          <p>Runs entirely on your machine using Ollama. Your data never leaves your system — no cloud APIs, no tracking.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
