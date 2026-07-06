import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { translate } from '@vitalets/google-translate-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const SCHEMES_DIR = path.join(__dirname, '..', 'ai-service', 'data', 'schemes');

// In-memory chat history (use MongoDB in production)
const chatHistory = [];

// --- Scheme data loaded from markdown files ---
let schemesCache = null;

function loadSchemes() {
  if (schemesCache) return schemesCache;

  const schemes = [];
  if (!fs.existsSync(SCHEMES_DIR)) return schemes;

  const files = fs.readdirSync(SCHEMES_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(SCHEMES_DIR, file), 'utf-8');
    const titleMatch = content.match(/^#\s+(.+)/m);
    const overviewMatch = content.match(/## Overview\n([\s\S]*?)(?=\n##)/);
    const eligibilityMatch = content.match(/## Eligibility[\s\S]*?\n([\s\S]*?)(?=\n##)/);
    const benefitsMatch = content.match(/## Benefits\n([\s\S]*?)(?=\n##)/);
    const ministryMatch = content.match(/## Ministry\n([\s\S]*?)(?=\n##|\n$)/);
    const websiteMatch = content.match(/## Website\n([\s\S]*?)(?=\n##|\n$)/);

    schemes.push({
      id: path.basename(file, '.md'),
      title: titleMatch ? titleMatch[1].trim() : file,
      overview: overviewMatch ? overviewMatch[1].trim() : '',
      eligibility: eligibilityMatch ? eligibilityMatch[1].trim() : '',
      benefits: benefitsMatch ? benefitsMatch[1].trim() : '',
      ministry: ministryMatch ? ministryMatch[1].trim() : '',
      website: websiteMatch ? websiteMatch[1].trim() : '',
      source: file,
      fullContent: content
    });
  }

  schemesCache = schemes;
  return schemes;
}

// --- Smart local RAG (works without Python service) ---
function localRAG(message, profile) {
  const schemes = loadSchemes();
  const query = message.toLowerCase();

  // Keyword-based scoring
  const scored = schemes.map(scheme => {
    let score = 0;
    const fullText = (scheme.fullContent || '').toLowerCase();

    // Direct keyword matches
    const keywords = query.split(/\s+/).filter(w => w.length > 2);
    for (const kw of keywords) {
      if (fullText.includes(kw)) score += 2;
      if (scheme.title.toLowerCase().includes(kw)) score += 5;
    }

    // Profile-based matching
    if (profile) {
      if (profile.occupation) {
        const occ = profile.occupation.toLowerCase();
        if (fullText.includes(occ)) score += 10;
        if (occ.includes('farmer') && (fullText.includes('farmer') || fullText.includes('kisan'))) score += 15;
        if (occ.includes('student') && (fullText.includes('scholarship') || fullText.includes('internship'))) score += 15;
        if (occ.includes('business') && (fullText.includes('entrepreneur') || fullText.includes('mudra') || fullText.includes('stand up'))) score += 15;
      }
      if (profile.gender === 'female' && (fullText.includes('women') || fullText.includes('woman') || fullText.includes('girl'))) score += 8;
      if (profile.category && fullText.includes(profile.category.toLowerCase())) score += 8;
      if (profile.income) {
        const income = parseInt(profile.income);
        if (income < 300000 && fullText.includes('bpl')) score += 10;
        if (income < 600000 && fullText.includes('ews')) score += 8;
      }
    }

    // Context keywords
    if (query.includes('farm') || query.includes('kisan') || query.includes('agriculture')) {
      if (fullText.includes('farmer') || fullText.includes('kisan') || fullText.includes('crop')) score += 12;
    }
    if (query.includes('health') || query.includes('hospital') || query.includes('medical')) {
      if (fullText.includes('health') || fullText.includes('hospital')) score += 12;
    }
    if (query.includes('house') || query.includes('home') || query.includes('housing') || query.includes('awas')) {
      if (fullText.includes('housing') || fullText.includes('awas')) score += 12;
    }
    if (query.includes('pension') || query.includes('retire') || query.includes('old age')) {
      if (fullText.includes('pension')) score += 12;
    }
    if (query.includes('loan') || query.includes('business') || query.includes('startup') || query.includes('entrepreneur')) {
      if (fullText.includes('loan') || fullText.includes('enterprise') || fullText.includes('mudra')) score += 12;
    }
    if (query.includes('education') || query.includes('scholarship') || query.includes('student') || query.includes('study')) {
      if (fullText.includes('scholarship') || fullText.includes('education') || fullText.includes('internship')) score += 12;
    }
    if (query.includes('gas') || query.includes('lpg') || query.includes('cooking') || query.includes('ujjwala')) {
      if (fullText.includes('lpg') || fullText.includes('ujjwala')) score += 12;
    }
    if (query.includes('girl') || query.includes('daughter') || query.includes('beti') || query.includes('sukanya')) {
      if (fullText.includes('girl') || fullText.includes('sukanya') || fullText.includes('beti')) score += 12;
    }
    if (query.includes('job') || query.includes('employment') || query.includes('work') || query.includes('rozgar')) {
      if (fullText.includes('employment') || fullText.includes('mgnrega') || fullText.includes('work guarantee')) score += 12;
    }
    if (query.includes('sc') || query.includes('st') || query.includes('dalit') || query.includes('tribal') || query.includes('obc')) {
      if (fullText.includes('sc/st') || fullText.includes('scheduled')) score += 10;
    }

    return { scheme, score };
  });

  // Sort by score and get top matches
  const topMatches = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

  if (topMatches.length === 0) {
    return {
      reply: `I searched through ${schemes.length} government schemes but couldn't find a specific match for your query. Here are some things you can try:\n\n` +
        `- Tell me about your **occupation** (farmer, student, business owner, etc.)\n` +
        `- Mention your **needs** (housing, health insurance, pension, loan, education)\n` +
        `- Share details like **income level**, **gender**, **state**, or **caste category**\n\n` +
        `For example, try: *"I am a farmer in UP with 2 acres of land"* or *"I need a housing loan, my income is 2 lakh per year"*`,
      citations: [],
      schemes: schemes.map(s => ({ id: s.id, title: s.title }))
    };
  }

  // Build response
  let reply = `Based on your query, I found **${topMatches.length} relevant government scheme(s)**:\n\n`;

  for (const match of topMatches) {
    const s = match.scheme;
    reply += `### 🏛️ ${s.title}\n`;
    reply += `${s.overview.substring(0, 200)}...\n\n`;

    if (s.eligibility) {
      reply += `**Eligibility:**\n${s.eligibility.substring(0, 300)}\n\n`;
    }
    if (s.benefits) {
      reply += `**Key Benefits:**\n${s.benefits.substring(0, 300)}\n\n`;
    }
    if (s.website) {
      reply += `🔗 **Website:** ${s.website.trim()}\n\n`;
    }
    reply += `---\n\n`;
  }

  reply += `📄 **Sources:** ${topMatches.map(m => m.scheme.source).join(', ')}\n\n`;
  reply += `💡 *Want more details about a specific scheme? Just ask!*`;

  return {
    reply,
    citations: topMatches.map(m => m.scheme.source),
    schemes: topMatches.map(m => ({
      id: m.scheme.id,
      title: m.scheme.title,
      score: m.score
    }))
  };
}

// --- Controllers ---
export const handleChat = async (req, res) => {
  try {
    const { message, profile, language } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let processedMessage = message;
    let targetLang = language || 'en';

    // Translate user message to English if it's not in English
    if (targetLang !== 'en') {
      try {
        const transRes = await translate(message, { to: 'en' });
        processedMessage = transRes.text;
      } catch (err) {
        console.error('Translation error (to en):', err);
      }
    }

    let result;

    // Try Python AI service first (if running)
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/query`, {
        message: processedMessage,
        profile
      }, { timeout: 30000 });
      result = aiResponse.data;
    } catch (aiError) {
      // Fall back to local RAG
      console.log('⚠️  AI service not available, using local RAG engine');
      result = localRAG(processedMessage, profile);
    }

    // Translate reply back to the user's language if needed
    if (targetLang !== 'en' && result.reply) {
      try {
        const transRes = await translate(result.reply, { to: targetLang });
        result.reply = transRes.text;
      } catch (err) {
        console.error(`Translation error (to ${targetLang}):`, err);
      }
    }

    // Store in chat history
    chatHistory.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userMessage: message,
      botReply: result.reply,
      citations: result.citations || [],
      profile
    });

    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const getChatHistory = (req, res) => {
  res.json({ history: chatHistory.slice(-50) });
};
