import express from 'express';
import InterviewSession from '../models/InterviewSession.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get history of completed interviews
router.get('/history', protect, async (req, res) => {
  try {
    const history = await InterviewSession.find({ userId: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save a new mock interview session result
router.post('/session', protect, async (req, res) => {
  const { type, company, questions, overallFeedback } = req.body;
  
  if (!type || !questions || !overallFeedback) {
    return res.status(400).json({ message: 'Type, questions, and overallFeedback are required' });
  }

  try {
    const session = await InterviewSession.create({
      userId: req.user._id,
      type,
      company: company || 'General',
      status: 'completed',
      questions,
      overallFeedback
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
