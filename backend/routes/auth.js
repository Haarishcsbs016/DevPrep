import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { fetchCodingStats } from '../services/profileFetcher.js';

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
        githubUsername: user.githubUsername,
        leetcodeUsername: user.leetcodeUsername,
        hackerrankUsername: user.hackerrankUsername || '',
        hackerearthUsername: user.hackerearthUsername || '',
        profileStats: user.profileStats,
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
        hackerrankUsername: user.hackerrankUsername || '',
        hackerearthUsername: user.hackerearthUsername || '',
        profileStats: user.profileStats,
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
    
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.githubUsername !== undefined) user.githubUsername = req.body.githubUsername;
    if (req.body.leetcodeUsername !== undefined) user.leetcodeUsername = req.body.leetcodeUsername;
    if (req.body.hackerrankUsername !== undefined) user.hackerrankUsername = req.body.hackerrankUsername;
    if (req.body.hackerearthUsername !== undefined) user.hackerearthUsername = req.body.hackerearthUsername;
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
      hackerrankUsername: updatedUser.hackerrankUsername || '',
      hackerearthUsername: updatedUser.hackerearthUsername || '',
      profileStats: updatedUser.profileStats,
      completedRoadmapTasks: updatedUser.completedRoadmapTasks || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync Coding Profiles stats
router.post('/sync-profiles', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { githubUsername, leetcodeUsername, hackerrankUsername, hackerearthUsername } = req.body;

    // Update handles if provided in request body
    if (githubUsername !== undefined) user.githubUsername = githubUsername;
    if (leetcodeUsername !== undefined) user.leetcodeUsername = leetcodeUsername;
    if (hackerrankUsername !== undefined) user.hackerrankUsername = hackerrankUsername;
    if (hackerearthUsername !== undefined) user.hackerearthUsername = hackerearthUsername;

    // Fetch stats
    const fetchedStats = await fetchCodingStats(
      user.leetcodeUsername,
      user.githubUsername,
      user.hackerrankUsername,
      user.hackerearthUsername
    );

    // Save fetched stats into user profileStats
    user.profileStats = {
      ...user.profileStats,
      leetcode: fetchedStats.leetcode,
      hackerrank: fetchedStats.hackerrank,
      hackerearth: fetchedStats.hackerearth,
      github: fetchedStats.github,
      lastSynced: new Date()
    };

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      onboardingCompleted: updatedUser.onboardingCompleted,
      profile: updatedUser.profile,
      githubUsername: updatedUser.githubUsername,
      leetcodeUsername: updatedUser.leetcodeUsername,
      hackerrankUsername: updatedUser.hackerrankUsername || '',
      hackerearthUsername: updatedUser.hackerearthUsername || '',
      profileStats: updatedUser.profileStats,
      completedRoadmapTasks: updatedUser.completedRoadmapTasks || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
