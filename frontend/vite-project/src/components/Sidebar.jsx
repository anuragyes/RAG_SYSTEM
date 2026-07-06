import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Search, Upload, Info } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">🏛️</div>
        <h2>Scheme Navigator</h2>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>

        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={18} className="nav-icon" />
          Home
        </NavLink>

        <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare size={18} className="nav-icon" />
          AI Chat
        </NavLink>

        <NavLink to="/explore" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Search size={18} className="nav-icon" />
          Explore Schemes
        </NavLink>

        <NavLink to="/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Upload size={18} className="nav-icon" />
          Upload Document
        </NavLink>

        <div className="nav-section-label" style={{ marginTop: '1rem' }}>Info</div>

        <NavLink to="/about" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Info size={18} className="nav-icon" />
          About
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div>🇮🇳 Powered by Open Source AI</div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>Ollama + LangChain + ChromaDB</div>
      </div>
    </aside>
  );
};

export default Sidebar;
