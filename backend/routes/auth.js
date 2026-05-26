import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate Token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'devprep_super_secret_key_123!', {
    expiresIn: '30d',
  });
};

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        profile: user.profile,
        completedRoadmapTasks: user.completedRoadmapTasks || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        profile: user.profile,
        githubUsername: user.githubUsername,
        leetcodeUsername: user.leetcodeUsername,
        completedRoadmapTasks: user.completedRoadmapTasks || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

// Update Profile / Onboarding
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Map body inputs to profile
    if (req.body.profile) {
      user.profile = {
        targetRole: req.body.profile.targetRole || user.profile.targetRole,
        knownSkills: req.body.profile.knownSkills || user.profile.knownSkills,
        weakAreas: req.body.profile.weakAreas || user.profile.weakAreas,
        targetCompanies: req.body.profile.targetCompanies || user.profile.targetCompanies,
        dsaConfidence: req.body.profile.dsaConfidence || user.profile.dsaConfidence,
      };
    }
    
    if (req.body.githubUsername !== undefined) user.githubUsername = req.body.githubUsername;
    if (req.body.leetcodeUsername !== undefined) user.leetcodeUsername = req.body.leetcodeUsername;
    if (req.body.onboardingCompleted !== undefined) user.onboardingCompleted = req.body.onboardingCompleted;
    if (req.body.completedRoadmapTasks !== undefined) user.completedRoadmapTasks = req.body.completedRoadmapTasks;

    const updatedUser = await user.save();
    
    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      onboardingCompleted: updatedUser.onboardingCompleted,
      profile: updatedUser.profile,
      githubUsername: updatedUser.githubUsername,
      leetcodeUsername: updatedUser.leetcodeUsername,
      completedRoadmapTasks: updatedUser.completedRoadmapTasks || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
