import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import axios from 'axios';
import Tesseract from 'tesseract.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const SCHEMES_DIR = path.join(__dirname, '..', 'ai-service', 'data', 'schemes');

// List all available schemes
export const listSchemes = (req, res) => {
  try {
    if (!fs.existsSync(SCHEMES_DIR)) {
      return res.json({ schemes: [], total: 0 });
    }

    const files = fs.readdirSync(SCHEMES_DIR).filter(f => f.endsWith('.md'));
    const schemes = files.map(file => {
      const content = fs.readFileSync(path.join(SCHEMES_DIR, file), 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)/m);
      const overviewMatch = content.match(/## Overview\n([\s\S]*?)(?=\n##)/);
      const ministryMatch = content.match(/## Ministry\n([\s\S]*?)(?=\n##|\n$)/);
      const websiteMatch = content.match(/## Website\n([\s\S]*?)(?=\n##|\n$)/);

      // Determine category from content
      let category = 'General';
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('farmer') || lowerContent.includes('kisan') || lowerContent.includes('crop')) category = 'Agriculture';
      else if (lowerContent.includes('health') || lowerContent.includes('hospital')) category = 'Health';
      else if (lowerContent.includes('housing') || lowerContent.includes('awas')) category = 'Housing';
      else if (lowerContent.includes('pension')) category = 'Pension';
      else if (lowerContent.includes('scholarship') || lowerContent.includes('education') || lowerContent.includes('internship')) category = 'Education';
      else if (lowerContent.includes('loan') || lowerContent.includes('enterprise') || lowerContent.includes('mudra')) category = 'Business';
      else if (lowerContent.includes('lpg') || lowerContent.includes('gas')) category = 'Energy';
      else if (lowerContent.includes('girl') || lowerContent.includes('women')) category = 'Women & Child';
      else if (lowerContent.includes('employment') || lowerContent.includes('mgnrega')) category = 'Employment';

      return {
        id: path.basename(file, '.md'),
        title: titleMatch ? titleMatch[1].trim() : file,
        overview: overviewMatch ? overviewMatch[1].trim().substring(0, 200) + '...' : '',
        ministry: ministryMatch ? ministryMatch[1].trim() : '',
        website: websiteMatch ? websiteMatch[1].trim() : '',
        category,
        source: file
      };
    });

    res.json({ schemes, total: schemes.length });
  } catch (error) {
    console.error('Error listing schemes:', error);
    res.status(500).json({ error: 'Failed to list schemes' });
  }
};

// Get full scheme data by ID
export const getSchemeData = (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(SCHEMES_DIR, `${id}.md`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Scheme not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ id, content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get scheme' });
  }
};

// Handle document upload
export const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    };

    // Try to forward to AI service for processing
    try {
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', fs.createReadStream(req.file.path), req.file.originalname);

      const aiResponse = await axios.post(`${AI_SERVICE_URL}/ingest`, formData, {
        headers: formData.getHeaders(),
        timeout: 120000
      });

      res.json({
        status: 'success',
        message: 'Document uploaded and indexed',
        file: fileInfo,
        ai_result: aiResponse.data
      });
    } catch (aiError) {
      // AI service not running — just save the file
      res.json({
        status: 'uploaded',
        message: 'Document saved. Start the AI service (Python) to index it into the knowledge base.',
        file: fileInfo
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
};

// Handle extracting text from images and pdfs to build a profile
export const extractProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    let text = '';

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const { data } = await Tesseract.recognize(
        req.file.path,
        'eng',
        { logger: m => console.log(m) }
      );
      text = data.text;
    } else {
      return res.status(400).json({ error: 'Unsupported file type for OCR' });
    }

    res.json({
      status: 'success',
      extractedText: text
    });
  } catch (error) {
    console.error('Extract profile error:', error);
    res.status(500).json({ error: 'Failed to extract text from document', details: error.message });
  }
};
// restart trigger
