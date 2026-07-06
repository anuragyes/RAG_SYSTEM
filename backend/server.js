import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['https://rag-system-1-7t3o.onrender.com'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection (optional — works without MongoDB too)
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected');
    } else {
      console.warn('⚠️  MONGODB_URI not set — running without database (in-memory mode)');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'scheme-navigator-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Scheme Navigator API Gateway running on http://localhost:${PORT}`);
    console.log(`📋 Health: http://localhost:${PORT}/health`);
    console.log(`🤖 AI Service expected at: http://localhost:8000`);
    console.log(`💡 Frontend expected at: http://localhost:5173\n`);
  });
};

startServer();
