import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import MessageBubble from './MessageBubble';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Namaste! I am the Eligibility Navigator. Tell me about your situation (e.g., your state, occupation, income, or land ownership) and I'll find government schemes you qualify for.",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Assuming backend is running on 5000
      const response = await fetch('https://rag-system-5rjn.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage.text })
      });

      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply,
        citations: data.citations
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "Sorry, I am having trouble connecting to the server. Please ensure the backend is running."
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  return (
    <div className="chat-section glass-panel">
      <div className="chat-history" ref={chatHistoryRef}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {isTyping && (
          <div className="message-row bot">
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

      <div className="input-area">
        <textarea
          className="input-field"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="I am a farmer in Madhya Pradesh. I own 2 acres of land..."
          rows={1}
        />
        <button 
          className="send-btn" 
          onClick={handleSend}
          disabled={!inputText.trim() || isTyping}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
