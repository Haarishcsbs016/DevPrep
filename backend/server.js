import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/auth.js';
import dsaRoutes from './routes/dsa.js';
import interviewRoutes from './routes/interviews.js';
import resumeRoutes from './routes/resume.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/resume', resumeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Port configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('CRITICAL: MONGODB_URI environment variable is not defined in backend/.env!');
  process.exit(1);
}

// Connect to MongoDB Atlas and boot server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas database!');
  })
  .catch((err) => {
    console.log('--------------------------------------------------------------------------------');
    console.log('WARNING: Failed to connect to MongoDB Atlas (e.g., IP whitelist block).');
    console.log('Express will automatically redirect MongoDB queries to the local JSON-file DB.');
    console.log('--------------------------------------------------------------------------------');
  });

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
