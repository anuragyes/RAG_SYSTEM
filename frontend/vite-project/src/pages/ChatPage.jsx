import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Mic, Paperclip, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

const API_URL = 'https://rag-system-5rjn.onrender.com/api';

const ChatPage = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "🙏 **Namaste!** I am your AI Scheme Navigator.\n\nTell me about yourself and I'll find government schemes you qualify for. For example:\n\n- *\"I am a farmer in Madhya Pradesh with 2 acres of land\"*\n- *\"I need health insurance, my family income is ₹2 lakh\"*\n- *\"I want to start a small business, I am SC category\"*\n- *\"What schemes are available for my daughter's education?\"*"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [profile, setProfile] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [language, setLanguage] = useState('en');
  const chatRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text, profile, language })
      });
      const data = await res.json();

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply,
        citations: data.citations || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "⚠️ Could not connect to the backend. Make sure the server is running on `http://localhost:5000`."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch(`${API_URL}/extract-profile`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        const userMsg = { id: Date.now(), sender: 'user', text: `[Uploaded Document]\nExtracted Text: ${data.extractedText.substring(0, 200)}...` };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        
        const res2 = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `I uploaded a document with this text, find me schemes: ${data.extractedText}`, profile, language })
        });
        const chatData = await res2.json();
        
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: chatData.reply,
          citations: chatData.citations || []
        }]);
      } else {
        alert('Failed to extract text from document');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading document');
    } finally {
      setIsExtracting(false);
      setIsTyping(false);
      e.target.value = null;
    }
  };

  const quickPrompts = [
    "I am a farmer with 3 acres in UP",
    "Health insurance for BPL family",
    "Business loan for women entrepreneur",
    "Scholarship for my daughter"
  ];

  return (
    <div style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      {/* Profile Toggle */}
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600 }}>
          <Sparkles size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--accent-purple)' }} />
          {t('AI Eligibility Chat')}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select className="form-select" value={language} onChange={handleLanguageChange} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}>
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setShowProfile(!showProfile)}>
            {showProfile ? t('Hide Profile') : t('Set Profile')}
          </button>
        </div>
      </div>

      {/* Profile Panel */}
      {showProfile && (
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <div className="profile-grid">
            <div className="form-group">
              <label>State</label>
              <input className="form-input" placeholder="e.g. Maharashtra" value={profile.state || ''}
                onChange={e => setProfile(p => ({ ...p, state: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Occupation</label>
              <select className="form-select" value={profile.occupation || ''}
                onChange={e => setProfile(p => ({ ...p, occupation: e.target.value }))}>
                <option value="">Select...</option>
                <option value="farmer">Farmer</option>
                <option value="student">Student</option>
                <option value="business">Business Owner</option>
                <option value="salaried">Salaried Employee</option>
                <option value="unemployed">Unemployed</option>
                <option value="homemaker">Homemaker</option>
                <option value="labourer">Daily Wage Labourer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Annual Income (₹)</label>
              <input className="form-input" type="number" placeholder="e.g. 200000"
                value={profile.income || ''} onChange={e => setProfile(p => ({ ...p, income: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select className="form-select" value={profile.gender || ''}
                onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-select" value={profile.category || ''}
                onChange={e => setProfile(p => ({ ...p, category: e.target.value }))}>
                <option value="">Select...</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
            <div className="form-group">
              <label>Age</label>
              <input className="form-input" type="number" placeholder="e.g. 35"
                value={profile.age || ''} onChange={e => setProfile(p => ({ ...p, age: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages" ref={chatRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            <div className="message-avatar">
              {msg.sender === 'bot' ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className="message-bubble">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
              {msg.citations && msg.citations.length > 0 && (
                <div className="citations-block">
                  {msg.citations.map((c, i) => (
                    <span key={i} className="citation-tag">📄 {c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message-row bot">
            <div className="message-avatar"><Bot size={18} /></div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {quickPrompts.map((prompt, i) => (
            <button key={i} className="filter-chip" onClick={() => { setInput(prompt); }}>
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".pdf,.png,.jpg,.jpeg" 
          onChange={handleFileUpload} 
        />
        <button 
          className="btn btn-icon" 
          onClick={() => fileInputRef.current.click()}
          title={t('Upload Document')}
          disabled={isExtracting}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', padding: '0.6rem', borderRadius: '8px', color: 'var(--text-secondary)' }}
        >
          {isExtracting ? <Loader2 size={18} className="spinner" /> : <Paperclip size={18} />}
        </button>
        <textarea
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('Describe your situation...')}
          rows={1}
          style={{ flex: 1, resize: 'none', padding: '0.8rem 1rem', borderRadius: '24px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}
        />
        <button 
          className="btn btn-icon" 
          onClick={handleMicClick}
          title={isListening ? t('Stop') : t('Speak')}
          style={{ background: isListening ? '#ffebee' : 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', padding: '0.6rem', borderRadius: '8px', color: isListening ? 'red' : 'var(--text-secondary)' }}
        >
          <Mic size={18} />
        </button>
        <button className="send-btn" onClick={handleSend} disabled={!input.trim() || isTyping} style={{ padding: '0.6rem 1rem', borderRadius: '24px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
