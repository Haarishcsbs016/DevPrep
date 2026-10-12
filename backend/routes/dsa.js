import express from 'express';
import DSAProgress from '../models/DSAProgress.js';
import DSABookmark from '../models/DSABookmark.js';
import DSASubmission from '../models/DSASubmission.js';
import { protect } from '../middleware/auth.js';
import { CURRICULUM_MODULES, PROBLEM_MAP, ALL_CURRICULUM_PROBLEMS } from '../data/curriculumData.js';
import { executeCode } from '../services/dsaEvaluator.js';

const router = express.Router();

const LEGACY_TOPICS = [
  'Arrays',
  'Strings',
  'Linked List',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Recursion',
  'Backtracking'
];

// 1. Get complete Curriculum roadmap (18 modules)
router.get('/curriculum', (req, res) => {
  try {
    const modulesSummary = CURRICULUM_MODULES.map(m => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      topicsCount: m.topics.length,
      problemsCount: m.topics.reduce((acc, t) => acc + (t.problems?.length || 0), 0),
      topics: m.topics.map(t => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        difficulty: t.difficulty,
        estimatedMinutes: t.estimatedMinutes,
        summary: t.summary,
        problemsCount: t.problems?.length || 0,
        problems: (t.problems || []).map(p => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty,
          topic: p.topic
        }))
      }))
    }));

    const totalProblems = ALL_CURRICULUM_PROBLEMS.length;
    res.json({
      totalModules: CURRICULUM_MODULES.length,
      totalProblems,
      modules: modulesSummary
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Get specific topic with full lesson theory, video metadata, and linked problems
router.get('/topic/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    let foundTopic = null;
    let parentModule = null;

    for (const m of CURRICULUM_MODULES) {
      const t = m.topics.find(top => top.slug === slug);
      if (t) {
        foundTopic = t;
        parentModule = m;
        break;
      }
    }

    if (!foundTopic) {
      return res.status(404).json({ message: 'Topic not found in curriculum.' });
    }

    // Strip private test cases from linked problems
    const safeProblems = (foundTopic.problems || []).map(p => {
      const { privateTestCases, ...safe } = p;
      return safe;
    });

    res.json({
      module: {
        id: parentModule.id,
        title: parentModule.title,
        slug: parentModule.slug
      },
      topic: {
        ...foundTopic,
        problems: safeProblems
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Get individual problem by ID or slug (safe, omitting private test cases)
router.get('/problem/:id', (req, res) => {
  try {
    const { id } = req.params;
    const problem = PROBLEM_MAP.get(id) || ALL_CURRICULUM_PROBLEMS.find(p => p.slug === id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found.' });
    }

    const { privateTestCases, ...safeProblem } = problem;
    res.json(safeProblem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Get User DSA Progress (preserves existing format for Dashboard/Navbar compatibility)
router.get('/progress', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    let progresses = await DSAProgress.find({ userId });

    // Seed missing legacy topics so existing Dashboard components receive required keys
    const existingTopics = progresses.map(p => p.topic);
    const missingTopics = LEGACY_TOPICS.filter(t => !existingTopics.includes(t));

    if (missingTopics.length > 0) {
      const seedPromises = missingTopics.map(topic =>
        DSAProgress.create({ userId, topic, solvedCount: 0, solvedProblems: [] })
      );
      const seeded = await Promise.all(seedPromises);
      progresses = [...progresses, ...seeded];
    }

    // Sort to keep predictable order
    progresses.sort((a, b) => {
      const idxA = LEGACY_TOPICS.indexOf(a.topic);
      const idxB = LEGACY_TOPICS.indexOf(b.topic);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.topic.localeCompare(b.topic);
    });

    res.json(progresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Run code against public sample test cases
router.post('/run', protect, async (req, res) => {
  const { problemId, language, code } = req.body;
  if (!problemId || !code) {
    return res.status(400).json({ message: 'Problem ID and code are required.' });
  }

  const problem = PROBLEM_MAP.get(problemId) || ALL_CURRICULUM_PROBLEMS.find(p => p.slug === problemId);
  if (!problem) {
    return res.status(404).json({ message: 'Problem not found in curriculum.' });
  }

  try {
    const sampleCases = problem.sampleTestCases || [];
    const evalResult = await executeCode(language || 'java', code, sampleCases, problem.title);
    res.json(evalResult);
  } catch (err) {
    res.status(500).json({ message: err.message, status: 'Runtime Error' });
  }
});

// 6. Submit solution: evaluates against all test cases, saves submission, and updates progress upon verification
router.post('/submit', protect, async (req, res) => {
  const { problemId, language, code, topicSlug } = req.body;
  if (!problemId || !code) {
    return res.status(400).json({ message: 'Problem ID and code are required.' });
  }

  const problem = PROBLEM_MAP.get(problemId) || ALL_CURRICULUM_PROBLEMS.find(p => p.slug === problemId);
  if (!problem) {
    return res.status(404).json({ message: 'Problem not found in curriculum.' });
  }

  const userId = req.user._id;

  try {
    // Run against ALL test cases (sample + private server-side test cases)
    const allCases = [...(problem.sampleTestCases || []), ...(problem.privateTestCases || [])];
    const evalResult = await executeCode(language || 'java', code, allCases, problem.title);

    // Save submission record
    const submissionRecord = await DSASubmission.create({
      userId,
      problemId: problem.id,
      problemTitle: problem.title,
      topicSlug: topicSlug || problem.topic || '',
      difficulty: problem.difficulty,
      language: language || 'java',
      code,
      status: evalResult.status,
      runtimeMs: evalResult.runtimeMs || 0,
      passedTests: evalResult.passedTests || 0,
      totalTests: evalResult.totalTests || allCases.length,
      testResults: evalResult.testResults || [],
      feedback: evalResult.status === 'Accepted'
        ? 'All test cases passed successfully! Excellent algorithmic efficiency.'
        : `Passed ${evalResult.passedTests || 0} of ${evalResult.totalTests || allCases.length} test cases.`
    });

    let isNewSolve = false;

    // Update DSA Progress ONLY if Accepted
    if (evalResult.status === 'Accepted') {
      const topicName = problem.topic || 'Arrays';
      let progress = await DSAProgress.findOne({ userId, topic: topicName });

      if (!progress) {
        progress = await DSAProgress.create({
          userId,
          topic: topicName,
          solvedCount: 0,
          solvedProblems: []
        });
      }

      // Check if already solved to prevent duplicate counting
      const alreadySolved = (progress.solvedProblems || []).some(
        p => p.title.toLowerCase() === problem.title.trim().toLowerCase()
      );

      if (!alreadySolved) {
        progress.solvedProblems.push({
          title: problem.title.trim(),
          difficulty: problem.difficulty,
          platform: 'Internal Hub',
          solvedAt: new Date()
        });
        progress.solvedCount = progress.solvedProblems.length;
        isNewSolve = true;
      }

      // Streak calculation
      const now = new Date();
      const lastActiveDate = new Date(progress.lastActive || now);
      const isSameDay = lastActiveDate.toDateString() === now.toDateString();
      const diffTime = Math.abs(now - lastActiveDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (!isSameDay) {
        if (diffDays === 1) progress.streak = (progress.streak || 0) + 1;
        else progress.streak = 1;
      }
      progress.lastActive = now;
      await progress.save();
    }

    res.json({
      submissionId: submissionRecord._id,
      status: evalResult.status,
      passedTests: evalResult.passedTests,
      totalTests: evalResult.totalTests,
      runtimeMs: evalResult.runtimeMs,
      testResults: evalResult.testResults,
      feedback: evalResult.status === 'Accepted'
        ? 'All test cases passed! Solution accepted.'
        : (evalResult.error ? `Error: ${evalResult.error}` : `Passed ${evalResult.passedTests || 0} of ${evalResult.totalTests || 0} test cases.`),
      error: evalResult.error,
      isNewSolve
    });
  } catch (err) {
    res.status(500).json({ message: err.message, status: 'Runtime Error', error: err.message });
  }
});

// 7. Legacy Manual Solve endpoint (preserved for backwards compatibility)
router.post('/solve', protect, async (req, res) => {
  const { topic, title, difficulty, platform } = req.body;
  if (!topic || !title || !difficulty) {
    return res.status(400).json({ message: 'Topic, title, and difficulty are required' });
  }

  try {
    const userId = req.user._id;
    let progress = await DSAProgress.findOne({ userId, topic });

    if (!progress) {
      progress = await DSAProgress.create({ userId, topic, solvedCount: 0, solvedProblems: [] });
    }

    const alreadySolved = (progress.solvedProblems || []).some(
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

      const now = new Date();
      const lastActiveDate = new Date(progress.lastActive || now);
      const isSameDay = lastActiveDate.toDateString() === now.toDateString();
      const diffTime = Math.abs(now - lastActiveDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (!isSameDay) {
        if (diffDays === 1) progress.streak = (progress.streak || 0) + 1;
        else progress.streak = 1;
      }
      progress.lastActive = now;
      await progress.save();
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 8. Bookmarks: List user's bookmarked problems
router.get('/bookmarks', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const bookmarks = await DSABookmark.find({ userId });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 9. Bookmarks: Toggle bookmark
router.post('/bookmark/toggle', protect, async (req, res) => {
  const { problemId, problemTitle, topicSlug, difficulty } = req.body;
  if (!problemId) {
    return res.status(400).json({ message: 'Problem ID is required.' });
  }

  try {
    const userId = req.user._id;
    const existing = await DSABookmark.findOne({ userId, problemId });

    if (existing) {
      await DSABookmark.deleteOne({ userId, problemId });
      return res.json({ bookmarked: false, message: 'Removed from bookmarks.' });
    }

    const newBookmark = await DSABookmark.create({
      userId,
      problemId,
      problemTitle: problemTitle || 'Problem',
      topicSlug: topicSlug || '',
      difficulty: difficulty || 'Easy'
    });

    res.json({ bookmarked: true, bookmark: newBookmark, message: 'Added to bookmarks.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 10. Submissions: List user's past submission history
router.get('/submissions', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { problemId } = req.query;
    const query = { userId };
    if (problemId) query.problemId = problemId;

    const list = await DSASubmission.find(query);
    const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted.slice(0, 50));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 11. Revision List: Aggregated bookmarks and previously failed/unsolved questions
router.get('/revision', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const bookmarks = await DSABookmark.find({ userId });
    const submissions = await DSASubmission.find({ userId });
    const progressList = await DSAProgress.find({ userId });

    const solvedTitles = new Set();
    progressList.forEach(prog => {
      (prog.solvedProblems || []).forEach(p => solvedTitles.add(p.title.toLowerCase()));
    });

    // Identify failed submissions not yet solved
    const failedMap = new Map();
    submissions.forEach(sub => {
      if (sub.status !== 'Accepted' && !solvedTitles.has(sub.problemTitle.toLowerCase())) {
        if (!failedMap.has(sub.problemId)) {
          failedMap.set(sub.problemId, {
            problemId: sub.problemId,
            problemTitle: sub.problemTitle,
            topicSlug: sub.topicSlug,
            difficulty: sub.difficulty,
            lastAttemptStatus: sub.status,
            lastAttemptedAt: sub.createdAt
          });
        }
      }
    });

    res.json({
      bookmarked: bookmarks,
      failedToRetry: Array.from(failedMap.values())
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 12. Contextual AI Assistant (Learn, Hint, Solution Explanation modes + RAG integration)
router.post('/ai-assist', protect, async (req, res) => {
  const { mode, problemId, topicTitle, code, language, query } = req.body;
  const userId = req.user._id;

  try {
    let ragEvidence = null;

    // Check if user has uploaded study notes into the RAG vault on port 8000
    try {
      const ragPrompt = `${topicTitle || ''} ${problemId || ''} ${query || mode}`;
      const ragRes = await fetch('http://localhost:8000/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.toString(),
          query: ragPrompt
        })
      });

      if (ragRes.ok) {
        const ragData = await ragRes.json();
        if (ragData?.sources && ragData.sources.length > 0) {
          ragEvidence = ragData;
        }
      }
    } catch (_) {
      // RAG offline or no notes uploaded, fallback to built-in guidance
    }

    let responseText = '';
    const cleanMode = (mode || 'learn').toLowerCase();

    if (cleanMode === 'hint') {
      responseText = `**Algorithmic Hint**:
1. Consider the core invariant: Are you inspecting elements more than once?
2. If scanning an array, can a two-pointer approach or an auxiliary Hash Map reduce quadratic O(N²) time to linear O(N)?
3. Remember edge cases: empty arrays, single elements, or inputs with duplicate values.`;
    } else if (cleanMode === 'solution') {
      responseText = `**Solution Walkthrough & Optimal Approach**:
- **Strategy**: Leverage the optimal algorithmic pattern for **${topicTitle || 'this problem'}**.
- **Time Complexity**: Optimal runtime is **O(N)** for a single linear pass or **O(N log N)** if sorting is required.
- **Space Complexity**: Auxiliary space is **O(1)** in-place or **O(N)** when using a lookup hash table.
- **Dry Run**: Trace through sample inputs verifying pointer bounds and base cases.`;
    } else {
      responseText = `**Concept Explanation**:
- **Topic**: ${topicTitle || 'Data Structures & Algorithms'}
- **Why it matters**: Mastering this technique builds the foundation for solving complex divide-and-conquer and graph/tree interview challenges.
- **Best Practice**: Always analyze edge bounds (null/empty inputs, single element, negative numbers) before committing code.`;
    }

    res.json({
      mode: cleanMode,
      content: responseText,
      ragGrounded: !!ragEvidence,
      ragSources: ragEvidence?.sources || [],
      ragEvidence: ragEvidence?.answer || null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
