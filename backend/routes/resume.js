import express from 'express';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get resume analyses history
router.get('/history', protect, async (req, res) => {
  try {
    const history = await ResumeAnalysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save a new resume analysis report
router.post('/analysis', protect, async (req, res) => {
  const {
    fileName,
    atsScore,
    grade,
    sectionScores,
    missingKeywords,
    atsRisks,
    rewriteRecommendations,
    projectEnhancements,
    feedback,
    sourceType,
    jobDescription,
    matchedKeywords,
    jobKeywords
  } = req.body;

  if (!fileName || atsScore === undefined) {
    return res.status(400).json({ message: 'fileName and atsScore are required' });
  }

  try {
    const report = await ResumeAnalysis.create({
      userId: req.user._id,
      fileName,
      atsScore,
      grade: grade || '',
      sectionScores: sectionScores || [],
      missingKeywords: missingKeywords || [],
      atsRisks: atsRisks || [],
      rewriteRecommendations: rewriteRecommendations || [],
      projectEnhancements: projectEnhancements || [],
      feedback: feedback || '',
      sourceType: sourceType || 'pdf',
      jobDescription: jobDescription || '',
      matchedKeywords: matchedKeywords || [],
      jobKeywords: jobKeywords || []
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
