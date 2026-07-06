import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleChat, getChatHistory } from '../controller/chatcontroller.js';
import { handleUpload, listSchemes, getSchemeData, extractProfile } from '../controller/schemeController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- Multer config for PDF uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.md', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  }
});

// --- Chat Routes ---
router.post('/chat', handleChat);
router.get('/chat/history', getChatHistory);

// --- Document Upload ---
router.post('/upload', upload.single('document'), handleUpload);
router.post('/extract-profile', upload.single('document'), extractProfile);

// --- Scheme Routes ---
router.get('/schemes', listSchemes);
router.get('/schemes/:id', getSchemeData);

export default router;
