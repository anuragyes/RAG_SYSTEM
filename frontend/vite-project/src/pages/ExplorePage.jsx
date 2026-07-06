import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Building2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const CATEGORIES = ['All', 'Agriculture', 'Health', 'Housing', 'Education', 'Business', 'Pension', 'Employment', 'Energy', 'Women & Child', 'General'];

const ExplorePage = () => {
  const [schemes, setSchemes] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const res = await fetch(`${API_URL}/schemes`);
      const data = await res.json();
      setSchemes(data.schemes || []);
    } catch (err) {
      console.error('Failed to load schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = schemes.filter(s => {
    const matchesFilter = filter === 'All' || s.category === filter;
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.overview.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const askAboutScheme = (scheme) => {
    navigate('/chat');
    // The chat will be fresh; user can ask about the scheme
  };

  return (
    <div className="page-content">
      <div className="explorer-header">
        <h1>🏛️ Explore Government Schemes</h1>
        <p>Browse all {schemes.length} indexed Central Government schemes. Click any card to learn more.</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          style={{ width: '100%', paddingLeft: '2.75rem' }}
          placeholder="Search schemes by name or keyword..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {CATEGORIES.map(cat => (
          <button key={cat}
            className={`filter-chip ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Showing {filtered.length} of {schemes.length} schemes
      </p>

      {/* Scheme Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading schemes...
        </div>
      ) : (
        <div className="schemes-grid">
          {filtered.map(scheme => (
            <div key={scheme.id} className="scheme-card" onClick={() => setSelectedScheme(selectedScheme?.id === scheme.id ? null : scheme)}>
              <div className="scheme-card-header">
                <span className={`scheme-category ${scheme.category}`}>{scheme.category}</span>
              </div>
              <h3>{scheme.title}</h3>
              <p>{scheme.overview}</p>
              <div className="scheme-card-footer">
                <span className="scheme-ministry">
                  <Building2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                  {scheme.ministry.substring(0, 40)}
                </span>
                <button className="scheme-link" onClick={(e) => { e.stopPropagation(); askAboutScheme(scheme); }}>
                  Ask AI <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No schemes found matching your criteria. Try adjusting your filters.
        </div>
      )}

      {/* Modal for scheme details */}
      {selectedScheme && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem'
        }} onClick={() => setSelectedScheme(null)}>
          <div className="glass-panel" style={{ maxWidth: '700px', width: '100%', maxHeight: '80vh', overflow: 'auto', padding: '2rem' }}
            onClick={e => e.stopPropagation()}>
            <span className={`scheme-category ${selectedScheme.category}`} style={{ marginBottom: '1rem', display: 'inline-block' }}>
              {selectedScheme.category}
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>
              {selectedScheme.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
              {selectedScheme.overview}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <Building2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />
              {selectedScheme.ministry}
            </p>
            {selectedScheme.website && (
              <a href={selectedScheme.website} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                <ExternalLink size={14} /> {selectedScheme.website}
              </a>
            )}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => { setSelectedScheme(null); navigate('/chat'); }}>
                Ask AI About Eligibility
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedScheme(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
