import express from 'express';
import DSAProgress from '../models/DSAProgress.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const DSA_TOPICS = [
  'Arrays',
  'Strings',
  'Linked List',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Recursion',
  'Backtracking'
];

// Get DSA Progress
router.get('/progress', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    let progresses = await DSAProgress.find({ userId });

    // Seed missing topics so frontend gets all 8 topics consistently
    const existingTopics = progresses.map(p => p.topic);
    const missingTopics = DSA_TOPICS.filter(t => !existingTopics.includes(t));

    if (missingTopics.length > 0) {
      const seedPromises = missingTopics.map(topic => 
        DSAProgress.create({ userId, topic, solvedCount: 0, solvedProblems: [] })
      );
      const seeded = await Promise.all(seedPromises);
      progresses = [...progresses, ...seeded];
    }

    // Sort to keep a predictable order
    progresses.sort((a, b) => DSA_TOPICS.indexOf(a.topic) - DSA_TOPICS.indexOf(b.topic));
    res.json(progresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Record Solved Problem
router.post('/solve', protect, async (req, res) => {
  const { topic, title, difficulty, platform } = req.body;
  if (!topic || !title || !difficulty) {
    return res.status(400).json({ message: 'Topic, title, and difficulty are required' });
  }

  try {
    const userId = req.user._id;
    let progress = await DSAProgress.findOne({ userId, topic });

    if (!progress) {
      progress = new DSAProgress({ userId, topic, solvedCount: 0, solvedProblems: [] });
    }

    // Check if problem already solved (by matching title case-insensitive)
    const alreadySolved = progress.solvedProblems.some(
      p => p.title.toLowerCase() === title.trim().toLowerCase()
    );

    if (!alreadySolved) {
      progress.solvedProblems.push({
        title: title.trim(),
        difficulty,
        platform: platform || 'Internal',
        solvedAt: new Date()
      });
      progress.solvedCount = progress.solvedProblems.length;

      // Update streaks
      const now = new Date();
      const lastActiveDate = new Date(progress.lastActive);
      const isSameDay = lastActiveDate.toDateString() === now.toDateString();
      const diffTime = Math.abs(now - lastActiveDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (isSameDay) {
        // Streak remains same for today
      } else if (diffDays === 1) {
        progress.streak += 1;
      } else {
        progress.streak = 1; // reset streak to 1 if user broke it
      }
      progress.lastActive = now;

      await progress.save();
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
