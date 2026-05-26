'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Code2, 
  Zap, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  ChevronLeft, 
  Sparkles, 
  Play, 
  ArrowRight,
  HelpCircle,
  Code as CodeIcon,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  ExternalLink
} from 'lucide-react';

const STATIC_PROBLEMS: Record<string, { title: string; difficulty: 'Easy' | 'Medium' | 'Hard' }[]> = {
  'Arrays': [
    { title: 'Two Sum', difficulty: 'Easy' },
    { title: '3Sum', difficulty: 'Medium' },
    { title: 'Container With Most Water', difficulty: 'Medium' },
    { title: 'Maximum Subarray', difficulty: 'Medium' },
    { title: 'Next Permutation', difficulty: 'Hard' }
  ],
  'Strings': [
    { title: 'Valid Anagram', difficulty: 'Easy' },
    { title: 'Valid Palindrome', difficulty: 'Easy' },
    { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium' },
    { title: 'Group Anagrams', difficulty: 'Medium' },
    { title: 'Longest Palindromic Substring', difficulty: 'Medium' }
  ],
  'Linked List': [
    { title: 'Reverse Linked List', difficulty: 'Easy' },
    { title: 'Linked List Cycle', difficulty: 'Easy' },
    { title: 'Merge Two Sorted Lists', difficulty: 'Easy' },
    { title: 'Remove Nth Node From End of List', difficulty: 'Medium' },
    { title: 'Merge k Sorted Lists', difficulty: 'Hard' }
  ],
  'Trees': [
    { title: 'Invert Binary Tree', difficulty: 'Easy' },
    { title: 'Maximum Depth of Binary Tree', difficulty: 'Easy' },
    { title: 'Binary Tree Inorder Traversal', difficulty: 'Easy' },
    { title: 'Lowest Common Ancestor of a BST', difficulty: 'Medium' },
    { title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard' }
  ],
  'Graphs': [
    { title: 'Flood Fill', difficulty: 'Easy' },
    { title: 'Number of Islands', difficulty: 'Medium' },
    { title: 'Clone Graph', difficulty: 'Medium' },
    { title: 'Course Schedule', difficulty: 'Medium' },
    { title: 'Word Ladder', difficulty: 'Hard' }
  ],
  'Dynamic Programming': [
    { title: 'Climbing Stairs', difficulty: 'Easy' },
    { title: 'Coin Change', difficulty: 'Medium' },
    { title: 'Longest Common Subsequence', difficulty: 'Medium' },
    { title: 'House Robber', difficulty: 'Medium' },
    { title: 'Edit Distance', difficulty: 'Hard' }
  ],
  'Recursion': [
    { title: 'Fibonacci Number', difficulty: 'Easy' },
    { title: 'Subsets', difficulty: 'Medium' },
    { title: 'Permutations', difficulty: 'Medium' },
    { title: 'Generate Parentheses', difficulty: 'Medium' },
    { title: 'Tower of Hanoi', difficulty: 'Hard' }
  ],
  'Backtracking': [
    { title: 'Combination Sum', difficulty: 'Medium' },
    { title: 'Word Search', difficulty: 'Medium' },
    { title: 'Sudoku Solver', difficulty: 'Hard' },
    { title: 'N-Queens', difficulty: 'Hard' },
    { title: 'Palindromic Partitioning', difficulty: 'Hard' }
  ]
};

// Custom coding problem details mapping
const POPULAR_PROBLEMS_DB: Record<string, {
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  boilerplates: Record<string, string>;
  testCases: { args: any[]; expected: any }[];
}> = {
  'Two Sum': {
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    boilerplates: {
      javascript: `function twoSum(nums, target) {\n    // Write your JavaScript code here\n    \n}`,
      python: `def twoSum(nums, target):\n    # Write your Python code here\n    pass`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your C++ code here\n        \n    }\n};`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your Java code here\n        \n    }\n}`
    },
    testCases: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] }
    ]
  },
  'Valid Palindrome': {
    description: 'A phrase is a palindrome if, after converting all uppercase characters into lowercase characters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string s, return true if it is a palindrome, or false otherwise.',
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: 'false', explanation: '"raceacar" is not a palindrome.' }
    ],
    constraints: [
      '1 <= s.length <= 2 * 10^5',
      's consists only of printable ASCII characters.'
    ],
    boilerplates: {
      javascript: `function isPalindrome(s) {\n    // Write your JavaScript code here\n    \n}`,
      python: `def isPalindrome(s: str) -> bool:\n    # Write your Python code here\n    pass`,
      cpp: `class Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Write your C++ code here\n        \n    }\n};`,
      java: `class Solution {\n    public boolean isPalindrome(String s) {\n        // Write your Java code here\n        \n    }\n}`
    },
    testCases: [
      { args: ["A man, a plan, a canal: Panama"], expected: true },
      { args: ["race a car"], expected: false }
    ]
  },
  'Climbing Stairs': {
    description: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    examples: [
      { input: 'n = 2', output: '2', explanation: 'There are two ways to climb: 1 + 1, or 2.' },
      { input: 'n = 3', output: '3', explanation: 'There are three ways: 1 + 1 + 1, 1 + 2, or 2 + 1.' }
    ],
    constraints: [
      '1 <= n <= 45'
    ],
    boilerplates: {
      javascript: `function climbStairs(n) {\n    // Write your JavaScript code here\n    \n}`,
      python: `def climbStairs(n: int) -> int:\n    # Write your Python code here\n    pass`,
      cpp: `class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your C++ code here\n        \n    }\n};`,
      java: `class Solution {\n    public int climbStairs(int n) {\n        // Write your Java code here\n        \n    }\n}`
    },
    testCases: [
      { args: [2], expected: 2 },
      { args: [3], expected: 3 },
      { args: [5], expected: 8 }
    ]
  },
  'Invert Binary Tree': {
    description: 'Given the root of a binary tree, invert the tree, and return its root.',
    examples: [
      { input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' }
    ],
    constraints: [
      'The number of nodes in the tree is in the range [0, 100].',
      '-100 <= Node.val <= 100'
    ],
    boilerplates: {
      javascript: `function invertTree(root) {\n    // Write your JavaScript code here\n    \n}`,
      python: `def invertTree(root):\n    # Write your Python code here\n    pass`,
      cpp: `class Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        // Write your C++ code here\n        \n    }\n};`,
      java: `class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        // Write your Java code here\n        \n    }\n}`
    },
    testCases: [
      { args: [[4, 2, 7, 1, 3, 6, 9]], expected: [4, 7, 2, 9, 6, 3, 1] }
    ]
  }
};

const getFuncName = (title: string) => {
  const mapping: Record<string, string> = {
    'Two Sum': 'twoSum',
    '3Sum': 'threeSum',
    'Container With Most Water': 'maxArea',
    'Maximum Subarray': 'maxSubArray',
    'Next Permutation': 'nextPermutation',
    'Valid Anagram': 'isAnagram',
    'Valid Palindrome': 'isPalindrome',
    'Longest Substring Without Repeating Characters': 'lengthOfLongestSubstring',
    'Group Anagrams': 'groupAnagrams',
    'Longest Palindromic Substring': 'longestPalindrome',
    'Reverse Linked List': 'reverseList',
    'Linked List Cycle': 'hasCycle',
    'Merge Two Sorted Lists': 'mergeTwoLists',
    'Remove Nth Node From End of List': 'removeNthFromEnd',
    'Merge k Sorted Lists': 'mergeKLists',
    'Invert Binary Tree': 'invertTree',
    'Maximum Depth of Binary Tree': 'maxDepth',
    'Binary Tree Inorder Traversal': 'inorderTraversal',
    'Lowest Common Ancestor of a BST': 'lowestCommonAncestor',
    'Binary Tree Maximum Path Sum': 'maxPathSum'
  };
  
  if (mapping[title]) return mapping[title];
  
  return title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map((word, idx) => idx === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

const getFallbackProblem = (title: string, difficulty: 'Easy' | 'Medium' | 'Hard') => {
  const funcName = getFuncName(title);
  return {
    description: `Write a class or function method to solve the '${title}' coding interview problem.\n\nVerify runtime complexities and edge conditions.`,
    examples: [
      { input: 'Standard inputs', output: 'Correct outputs' }
    ],
    constraints: [
      'Optimize space allocations.',
      'Check structural recursion or iteration limits.'
    ],
    boilerplates: {
      javascript: `function ${funcName}() {\n    // Write your JavaScript code here\n    \n}`,
      python: `def ${funcName}():\n    # Write your Python code here\n    pass`,
      cpp: `class Solution {\npublic:\n    void ${funcName}() {\n        // Write your C++ code here\n        \n    }\n};`,
      java: `class Solution {\n    public void ${funcName}() {\n        // Write your Java code here\n        \n    }\n}`
    },
    testCases: [
      { args: [], expected: null }
    ]
  };
};

const LEETCODE_SLUGS: Record<string, string> = {
  '3Sum': '3sum',
  'Lowest Common Ancestor of a BST': 'lowest-common-ancestor-of-a-binary-search-tree',
  'Palindromic Partitioning': 'palindrome-partitioning',
  'Tower of Hanoi': 'https://www.geeksforgeeks.org/c-program-for-tower-of-hanoi/',
  'Longest Substring Without Repeating Characters': 'longest-substring-without-repeating-characters',
  'Binary Tree Inorder Traversal': 'binary-tree-inorder-traversal',
  'Binary Tree Maximum Path Sum': 'binary-tree-maximum-path-sum',
  'Maximum Depth of Binary Tree': 'maximum-depth-of-binary-tree',
  'Linked List Cycle': 'linked-list-cycle',
  'Remove Nth Node From End of List': 'remove-nth-node-from-end-of-list'
};

const getProblemUrl = (title: string) => {
  if (LEETCODE_SLUGS[title]) {
    if (LEETCODE_SLUGS[title].startsWith('http')) {
      return LEETCODE_SLUGS[title];
    }
    return `https://leetcode.com/problems/${LEETCODE_SLUGS[title]}/`;
  }
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `https://leetcode.com/problems/${slug}/`;
};

export default function DSATracker() {
  const { token, dsaProgress, setDSAProgress, geminiKey } = useStore();
  const [activeTopic, setActiveTopic] = useState<string | null>('Arrays');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states for custom question
  const [customTitle, setCustomTitle] = useState('');
  const [customTopic, setCustomTopic] = useState('Arrays');
  const [customDifficulty, setCustomDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [customPlatform, setCustomPlatform] = useState('LeetCode');

  // IDE states
  const [selectedProblem, setSelectedProblem] = useState<any | null>(null);
  const [ideLanguage, setIdeLanguage] = useState('javascript');
  const [editorCode, setEditorCode] = useState('');
  const [consoleTab, setConsoleTab] = useState<'testcases' | 'results' | 'report'>('testcases');
  const [runResults, setRunResults] = useState<any>(null);
  const [submitReport, setSubmitReport] = useState<any>(null);
  const [ideLoading, setIdeLoading] = useState(false);
  
  // Hint & Notes states
  const [leftTab, setLeftTab] = useState<'desc' | 'hint' | 'notes'>('desc');
  const [hintText, setHintText] = useState('');
  const [fetchingHint, setFetchingHint] = useState(false);
  const [problemNotes, setProblemNotes] = useState('');
  
  // Line number count
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    if (editorCode) {
      setLineCount(editorCode.split('\n').length || 1);
    } else {
      setLineCount(1);
    }
  }, [editorCode]);

  const fetchProgress = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dsa/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDSAProgress(data);
    } catch (e) {
      console.warn("fetchProgress warning:", e);
    }
  };

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchProgress().finally(() => setLoading(false));
    }
  }, [token]);

  const markAsSolved = async (topic: string, title: string, difficulty: 'Easy' | 'Medium' | 'Hard') => {
    try {
      const response = await fetch('http://localhost:5000/api/dsa/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic, title, difficulty, platform: 'Internal' })
      });
      if (response.ok) {
        await fetchProgress();
      }
    } catch (error) {
      console.warn("Error updating progress:", error);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/dsa/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: customTopic,
          title: customTitle.trim(),
          difficulty: customDifficulty,
          platform: customPlatform
        })
      });

      if (response.ok) {
        setCustomTitle('');
        await fetchProgress();
      }
    } catch (err) {
      console.warn("Custom problem submit warning:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const loadProblemIntoIDE = (problemTitle: string, difficulty: 'Easy' | 'Medium' | 'Hard', topicName: string) => {
    const details = POPULAR_PROBLEMS_DB[problemTitle] || getFallbackProblem(problemTitle, difficulty);
    const pb = {
      title: problemTitle,
      difficulty,
      topic: topicName,
      ...details
    };
    setSelectedProblem(pb);
    setIdeLanguage('javascript');
    setEditorCode(pb.boilerplates['javascript'] || '');
    setRunResults(null);
    setSubmitReport(null);
    setConsoleTab('testcases');
    setLeftTab('desc');
    setHintText('');
    
    // Load saved personal notes
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dsa_notes_${problemTitle}`) || '';
      setProblemNotes(saved);
    } else {
      setProblemNotes('');
    }
  };

  const handleNotesChange = (text: string) => {
    setProblemNotes(text);
    if (selectedProblem) {
      localStorage.setItem(`dsa_notes_${selectedProblem.title}`, text);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setIdeLanguage(lang);
    if (selectedProblem) {
      setEditorCode(selectedProblem.boilerplates[lang] || '');
    }
  };

  // Local sandboxed execution judge for JavaScript code
  const executeLocalJS = () => {
    setConsoleTab('results');
    setRunResults({ running: true });

    setTimeout(() => {
      try {
        const code = editorCode;
        const funcName = getFuncName(selectedProblem.title);
        
        // Build executable function
        const userFunc = new Function(`
          ${code}
          return ${funcName};
        `)();

        if (typeof userFunc !== 'function') {
          throw new Error(`Starter function '${funcName}' not found. Please review the boilerplate naming.`);
        }

        const cases = selectedProblem.testCases || [];
        const results = cases.map((tc: any, idx: number) => {
          let testArgs = JSON.parse(JSON.stringify(tc.args));
          const start = performance.now();
          const actualOutput = userFunc(...testArgs);
          const end = performance.now();

          const passed = JSON.stringify(actualOutput) === JSON.stringify(tc.expected);
          return {
            caseNum: idx + 1,
            args: tc.args,
            expected: tc.expected,
            actual: actualOutput,
            passed,
            duration: (end - start).toFixed(3)
          };
        });

        setRunResults({ running: false, success: true, results });
      } catch (err: any) {
        setRunResults({ running: false, success: false, error: err.message });
      }
    }, 400);
  };

  // AI Submission evaluation
  const submitToAIJudge = async () => {
    setConsoleTab('report');
    setIdeLoading(true);
    setSubmitReport({ loading: true });

    try {
      const systemPrompt = `You are a LeetCode/HackerRank Compiler Judge. Evaluate the candidate's code submission for correctness, optimal time/space complexity, and syntax errors.
      Format your grading evaluation strictly as a raw JSON response. Do not include markdown headers or backticks.
      The JSON must have the following keys:
      1. 'status': 'Accepted' or 'Failed' (Accepted if the logic works and is efficient, Failed if it has bugs or syntax errors).
      2. 'score': integer 0-100 (rating code quality and correctness).
      3. 'beatsPercent': float (simulated LeetCode speed rating, e.g. 92.4).
      4. 'timeComplexity': string (e.g. 'O(NlogN)').
      5. 'spaceComplexity': string (e.g. 'O(1)').
      6. 'feedback': string (2-3 sentences critiquing their approach, memory usage, or naming conventions).
      7. 'optimalCode': string (fully refactored, production-ready, clean optimal solution in the same language).
      8. 'optimalExplanation': string (1-2 sentences explaining why the optimal solution is better).`;

      const prompt = `Problem Title: ${selectedProblem.title}
Difficulty: ${selectedProblem.difficulty}
Topic Category: ${selectedProblem.topic}
Language selected: ${ideLanguage}
User Code Submission:
${editorCode}

Grade the code. Make sure to return ONLY raw JSON matching the keys requested.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt + "\n\n" + prompt }]
              }
            ]
          })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'AI Judge communication failed');
      }

      let cleanText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedReport = JSON.parse(cleanText.trim());
      setSubmitReport({ loading: false, success: true, data: parsedReport });

      // If accepted, mark it as solved in the DB
      if (parsedReport.status === 'Accepted') {
        await markAsSolved(selectedProblem.topic, selectedProblem.title, selectedProblem.difficulty);
      }
    } catch (err: any) {
      console.warn("AI Judge submission warning:", err);
      setSubmitReport({ 
        loading: false, 
        success: false, 
        error: err.message || 'Parser error grading code. Please check syntax and resubmit.' 
      });
    } finally {
      setIdeLoading(false);
    }
  };

  // Fetch AI hints
  const getAIHint = async () => {
    setFetchingHint(true);
    setHintText('');
    try {
      const hintPrompt = `You are a helpful coding interview mentor. A student is trying to solve the DSA problem "${selectedProblem.title}" (${selectedProblem.difficulty}) but is stuck.
      Write a concise, clever hint (1-2 sentences) that helps them think about the algorithm (e.g. using a two-pointer approach, hash map, or stack) without giving away any code or the final solution. Keep the hint encouraging and conceptual.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: hintPrompt }]
              }
            ]
          })
        }
      );

      const data = await response.json();
      const hint = data.candidates?.[0]?.content?.parts?.[0]?.text || "Focus on sorting or scanning arrays for linear complexities.";
      setHintText(hint);
    } catch (e: any) {
      setHintText("Try using a hashmap to store target differences for constant time index lookup.");
    } finally {
      setFetchingHint(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const safeProgress = Array.isArray(dsaProgress) ? dsaProgress : [];
  const totalSolved = safeProgress.reduce((acc, t) => acc + t.solvedCount, 0);
  const activeStreak = safeProgress.reduce((max, t) => Math.max(max, t.streak), 0);

  // 1. Difficulty distribution metrics
  const allSolvedProblems = safeProgress.flatMap(p => p.solvedProblems || []);
  const easyCount = allSolvedProblems.filter(p => p.difficulty === 'Easy').length;
  const mediumCount = allSolvedProblems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = allSolvedProblems.filter(p => p.difficulty === 'Hard').length;
  const totalProblemsSolved = allSolvedProblems.length;

  // 2. Next best challenge recommendation
  const getRecommendation = () => {
    const sortedTopics = [...safeProgress].sort((a, b) => a.solvedCount - b.solvedCount);
    if (sortedTopics.length === 0) return null;
    
    for (const topicProg of sortedTopics) {
      const questions = STATIC_PROBLEMS[topicProg.topic] || [];
      const unsolved = questions.find(q => 
        !topicProg.solvedProblems.some(sp => sp.title.toLowerCase() === q.title.toLowerCase())
      );
      if (unsolved) {
        return {
          topic: topicProg.topic,
          title: unsolved.title,
          difficulty: unsolved.difficulty,
          reason: `You have solved ${topicProg.solvedCount}/5 problems in ${topicProg.topic}. Solving this will help balance your category distribution.`
        };
      }
    }
    
    return {
      topic: 'Recursion',
      title: 'Tower of Hanoi',
      difficulty: 'Hard',
      reason: 'Outstanding! You have solved all standard problems. Try tackling this advanced challenge to push your limits!'
    };
  };
  const recommendation = getRecommendation();

  // 3. GitHub-Style coding activity heatmap (past 18 weeks = 126 days)
  const getHeatmapData = () => {
    const cells = [];
    const today = new Date();
    for (let i = 125; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toDateString();
      
      let count = 0;
      safeProgress.forEach(topic => {
        (topic.solvedProblems || []).forEach(sp => {
          if (sp.solvedAt) {
            const solvedDate = new Date(sp.solvedAt);
            if (solvedDate.toDateString() === dateString) {
              count++;
            }
          }
        });
      });
      
      cells.push({ date, count });
    }
    return cells;
  };
  const heatmapCells = getHeatmapData();

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-wide flex items-center space-x-2">
            <Code2 className="h-8 w-8 text-violet-500" />
            <span>DSA Practice Tracker</span>
          </h2>
          <p className="text-xs text-violet-400 mt-1">
            Write code, compile test cases, and evaluate algorithm complexities with the Gemini AI Judge.
          </p>
        </div>

        {selectedProblem && (
          <button
            onClick={() => setSelectedProblem(null)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-violet-950/40 border border-violet-800/40 text-violet-300 text-xs font-semibold hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to lobby</span>
          </button>
        )}
      </div>

      {/* LOBBY MODE (List View) */}
      {!selectedProblem ? (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-5 border-violet-950 flex items-center space-x-4">
              <div className="bg-violet-900/40 p-3.5 rounded-xl border border-violet-800/40 text-violet-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-violet-400">Total Solved</p>
                <h4 className="text-2xl font-extrabold text-white mt-0.5">{totalSolved} Problems</h4>
              </div>
            </div>

            <div className="glass-panel p-5 border-violet-950 flex items-center space-x-4">
              <div className="bg-pink-900/40 p-3.5 rounded-xl border border-pink-850 text-pink-400">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-pink-400">Active Streak</p>
                <h4 className="text-2xl font-extrabold text-white mt-0.5">{activeStreak} Days</h4>
              </div>
            </div>

            <div className="glass-panel p-5 border-violet-950 flex items-center space-x-4">
              <div className="bg-blue-900/40 p-3.5 rounded-xl border border-blue-800 text-blue-400">
                <Code2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-blue-400">Topics Tracked</p>
                <h4 className="text-2xl font-extrabold text-white mt-0.5">{safeProgress.length} Categories</h4>
              </div>
            </div>
          </div>

          {/* Secondary stats & recommendation row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Difficulty Breakdown */}
            <div className="glass-panel p-6 border-violet-950 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3 flex justify-between items-center">
                  <span>Difficulty Profile</span>
                  <span className="text-[10px] text-violet-400 font-mono">Solved by Tier</span>
                </h3>
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold">Easy</span>
                      <span className="text-white font-semibold">{easyCount} solved</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f0a28] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${totalProblemsSolved ? (easyCount / totalProblemsSolved) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-amber-400 font-semibold">Medium</span>
                      <span className="text-white font-semibold">{mediumCount} solved</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f0a28] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${totalProblemsSolved ? (mediumCount / totalProblemsSolved) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-rose-400 font-semibold">Hard</span>
                      <span className="text-white font-semibold">{hardCount} solved</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f0a28] rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${totalProblemsSolved ? (hardCount / totalProblemsSolved) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart challenge recommendation */}
            <div className="glass-panel p-6 border-violet-950 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3 flex justify-between items-center">
                  <span>Smart Placement Recommender</span>
                  <span className="text-[9px] text-pink-400 bg-pink-950/20 px-2 py-0.5 rounded-full border border-pink-950/50 uppercase font-mono tracking-wider animate-pulse">Placement Suggestion</span>
                </h3>
                {recommendation ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl border border-violet-900/40 bg-violet-950/20 flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-3">
                        <a
                          href={getProblemUrl(recommendation.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-white hover:text-violet-400 transition truncate flex items-center space-x-1 hover:underline cursor-pointer"
                        >
                          <span>{recommendation.title}</span>
                          <ExternalLink className="h-3 w-3 text-violet-400 shrink-0" />
                        </a>
                        <p className="text-[10px] text-violet-400 font-mono mt-0.5">{recommendation.topic} • <span className={
                          recommendation.difficulty === 'Easy' ? 'text-emerald-400' :
                          recommendation.difficulty === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                        }>{recommendation.difficulty}</span></p>
                      </div>
                      <div className="flex space-x-2 shrink-0">
                        <a
                          href={getProblemUrl(recommendation.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-yellow-600/10 hover:bg-yellow-600/20 border border-yellow-500/20 text-yellow-400 font-bold text-[9px] uppercase tracking-wider rounded-xl transition flex items-center space-x-1 cursor-pointer"
                        >
                          <span>LeetCode</span>
                        </a>
                        <button
                          onClick={() => loadProblemIntoIDE(recommendation.title, recommendation.difficulty as any, recommendation.topic)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-pink-500 hover:brightness-110 text-white font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition flex items-center space-x-1 cursor-pointer"
                        >
                          <span>IDE</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-violet-300 leading-normal italic">
                      💡 Reason: {recommendation.reason}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-violet-400 italic">No recommendations available.</p>
                )}
              </div>
            </div>
          </div>

          {/* GitHub-style Coding Submissions Heatmap */}
          <div className="glass-panel p-6 border-violet-950">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3 flex justify-between items-center">
              <span>Coding Practice Submissions Grid</span>
              <span className="text-[9px] text-violet-400 font-mono">Streaks: 18-week history</span>
            </h3>
            
            <div className="flex flex-col space-y-4">
              <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-violet-900 scrollbar-track-transparent">
                <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[650px] p-1 select-none">
                  {heatmapCells.map((cell, idx) => {
                    let color = "bg-violet-950/15 border border-violet-950/40";
                    if (cell.count === 1) color = "bg-violet-850 border border-violet-750/30";
                    else if (cell.count === 2) color = "bg-violet-600";
                    else if (cell.count >= 3) color = "bg-pink-500 shadow-md shadow-pink-500/10";
                    
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-sm transition-all duration-200 hover:scale-125 ${color}`}
                        title={`${cell.count} submission(s) on ${cell.date.toDateString()}`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between items-center text-[9px] text-violet-400 font-mono pt-1">
                <div className="flex items-center space-x-1">
                  <span>Less</span>
                  <div className="w-3.5 h-3.5 rounded-sm bg-violet-950/15 border border-violet-950/40" />
                  <div className="w-3.5 h-3.5 rounded-sm bg-violet-850 border border-violet-750/30" />
                  <div className="w-3.5 h-3.5 rounded-sm bg-violet-600" />
                  <div className="w-3.5 h-3.5 rounded-sm bg-pink-500" />
                  <span>More</span>
                </div>
                <span>Hover over grid cells to view submission dates</span>
              </div>
            </div>
          </div>

          {/* Main lobby split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left column: Topic Progress list */}
            <div className="space-y-3 lg:col-span-1">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-2">
                Categories & Progress
              </h3>
              
              {safeProgress.map((prog) => {
                const isSelected = activeTopic === prog.topic;
                const percentage = Math.min((prog.solvedCount / 5) * 100, 100);
                
                return (
                  <button
                    key={prog.topic}
                    onClick={() => setActiveTopic(prog.topic)}
                    className={`w-full p-4 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-950/60 border-violet-500 shadow-md shadow-violet-900/10'
                        : 'bg-[#120a2e]/30 border-violet-950 text-violet-300 hover:border-violet-900'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full mb-2">
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-violet-200'}`}>
                        {prog.topic}
                      </span>
                      <span className="text-[10px] font-mono bg-violet-950 px-2 py-0.5 rounded-full text-violet-400">
                        {prog.solvedCount} solved
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-violet-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-600 to-pink-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right column: Active Topic Question Board */}
            <div className="lg:col-span-2 space-y-6">
              {activeTopic ? (
                <>
                  {/* Checklist */}
                  <div className="glass-panel p-6 border-violet-950">
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3 flex justify-between items-center">
                      <span>Standard Questions for {activeTopic}</span>
                      <span className="text-xs text-violet-400">Click a title to open IDE</span>
                    </h3>

                    <div className="space-y-2.5">
                      {(STATIC_PROBLEMS[activeTopic] || []).map((problem, index) => {
                        const matchedProgress = safeProgress.find(p => p.topic === activeTopic);
                        const isSolved = matchedProgress?.solvedProblems.some(
                          sp => sp.title.toLowerCase() === problem.title.toLowerCase()
                        );
                        
                        const diffColor = 
                          problem.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-950/20 border-emerald-950/60' :
                          problem.difficulty === 'Medium' ? 'text-amber-400 bg-amber-950/20 border-amber-950/60' : 
                          'text-rose-400 bg-rose-950/20 border-rose-950/60';

                        return (
                          <div
                            key={index}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                              isSolved 
                                ? 'bg-violet-950/5 border-violet-950/30 text-violet-400/60'
                                : 'bg-[#120a2e]/30 border-violet-950 text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <button
                                onClick={() => markAsSolved(activeTopic, problem.title, problem.difficulty)}
                                className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                  isSolved
                                    ? 'bg-violet-600 border-violet-500 text-white'
                                    : 'border-violet-850 bg-black/30 hover:border-violet-500 cursor-pointer'
                                }`}
                              >
                                {isSolved && (
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              
                              <a
                                href={getProblemUrl(problem.title)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-left text-xs font-semibold hover:text-violet-400 transition truncate cursor-pointer hover:underline flex items-center space-x-1.5"
                              >
                                <span>{problem.title}</span>
                                <ExternalLink className="h-3.5 w-3.5 text-violet-400 opacity-60 hover:opacity-100 shrink-0" />
                              </a>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                              <a
                                href={getProblemUrl(problem.title)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-yellow-600/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-semibold hover:bg-yellow-600/20 transition-all cursor-pointer"
                              >
                                <span>LeetCode</span>
                              </a>
                              <button
                                onClick={() => loadProblemIntoIDE(problem.title, problem.difficulty, activeTopic)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-300 text-[10px] font-semibold hover:bg-violet-600/20 hover:text-white transition-all cursor-pointer"
                              >
                                <Code2 className="h-3 w-3" />
                                <span>Playground</span>
                              </button>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase shrink-0 ${diffColor}`}>
                                {problem.difficulty}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Custom Question Form */}
                  <div className="glass-panel p-6 border-violet-950">
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3 flex items-center space-x-2">
                      <Plus className="h-4 w-4 text-violet-400" />
                      <span>Log a Custom Problem</span>
                    </h3>

                    <form onSubmit={handleCustomSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-violet-300 mb-1.5 uppercase font-mono">
                            Problem Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Merge Intervals"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-xs transition"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-violet-300 mb-1.5 uppercase font-mono">
                            Difficulty
                          </label>
                          <select
                            value={customDifficulty}
                            onChange={(e) => setCustomDifficulty(e.target.value as any)}
                            className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-xs transition"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-violet-300 mb-1.5 uppercase font-mono">
                            Topic Category
                          </label>
                          <select
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-xs transition"
                          >
                            {safeProgress.map(p => (
                              <option key={p.topic} value={p.topic}>{p.topic}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-violet-300 mb-1.5 uppercase font-mono">
                            Coding Platform
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. LeetCode, CodeChef"
                            value={customPlatform}
                            onChange={(e) => setCustomPlatform(e.target.value)}
                            className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-xs transition"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-xs flex items-center space-x-1.5 hover:brightness-110 shadow-lg shadow-violet-950/40 transition cursor-pointer"
                        >
                          {submitting ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                          ) : (
                            <>
                              <span>Record solved problem</span>
                              <CheckCircle2 className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="glass-panel p-12 border-violet-950 flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-violet-400">Select a data structure topic to begin tracking.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* INTERACTIVE IDE COMPILER MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[72vh]">
          
          {/* LEFT PANEL: Description & Hints */}
          <div className="lg:col-span-5 glass-panel border-violet-950 flex flex-col overflow-hidden h-full">
            {/* Tabs Header */}
            <div className="flex bg-[#0a051d]/60 border-b border-violet-950/30 p-2 space-x-2 shrink-0">
              <button
                onClick={() => setLeftTab('desc')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  leftTab === 'desc' 
                    ? 'bg-violet-900/30 text-white border border-violet-850'
                    : 'text-violet-400 hover:text-white'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => {
                  setLeftTab('hint');
                  if (!hintText && !fetchingHint) {
                    getAIHint();
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                  leftTab === 'hint' 
                    ? 'bg-violet-900/30 text-white border border-violet-850'
                    : 'text-violet-400 hover:text-white'
                }`}
              >
                <Sparkles className="h-3 w-3 text-pink-400" />
                <span>AI Tutor Hint</span>
              </button>
              <button
                onClick={() => setLeftTab('notes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                  leftTab === 'notes' 
                    ? 'bg-violet-900/30 text-white border border-violet-850'
                    : 'text-violet-400 hover:text-white'
                }`}
              >
                <FileText className="h-3 w-3 text-violet-400" />
                <span>My Code Notes</span>
              </button>
            </div>

            {/* Tab content area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              {leftTab === 'desc' && (
                <>
                  {/* Title & Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-wide">
                        {selectedProblem.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                          selectedProblem.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-950/20 border-emerald-950/60' :
                          selectedProblem.difficulty === 'Medium' ? 'text-amber-400 bg-amber-950/20 border-amber-950/60' : 
                          'text-rose-400 bg-rose-950/20 border-rose-950/60'
                        }`}>
                          {selectedProblem.difficulty}
                        </span>
                        <span className="text-[10px] text-violet-400 font-mono">
                          Topic: {selectedProblem.topic}
                        </span>
                      </div>
                    </div>
                    
                    <a
                      href={getProblemUrl(selectedProblem.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-yellow-600/10 border border-yellow-500/25 text-yellow-400 text-[11px] font-semibold hover:bg-yellow-600/20 transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <span>Solve on LeetCode</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* Description Text */}
                  <p className="text-xs text-violet-200/90 leading-relaxed whitespace-pre-wrap">
                    {selectedProblem.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-4">
                    {selectedProblem.examples.map((ex: any, idx: number) => (
                      <div key={idx} className="space-y-1.5">
                        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Example {idx + 1}:</h4>
                        <div className="bg-black/40 border border-violet-950/60 rounded-xl p-3.5 font-mono text-[10px] space-y-1">
                          <p><span className="text-violet-400">Input:</span> <span className="text-white">{ex.input}</span></p>
                          <p><span className="text-pink-400">Output:</span> <span className="text-white">{ex.output}</span></p>
                          {ex.explanation && (
                            <p className="mt-1.5 pt-1.5 border-t border-violet-950/20 text-violet-400"><span className="font-semibold">Explanation:</span> {ex.explanation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Constraints */}
                  {selectedProblem.constraints && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Constraints:</h4>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-violet-400/90">
                        {selectedProblem.constraints.map((c: string, idx: number) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {leftTab === 'hint' && (
                /* AI Hint Tab */
                <div className="space-y-4 flex flex-col justify-between h-full">
                  <div className="p-4 rounded-2xl border border-violet-950 bg-[#120a2e]/30 space-y-3 relative">
                    <div className="flex items-center space-x-2 text-pink-400 font-extrabold uppercase text-[10px] font-mono tracking-wider border-b border-violet-950/40 pb-2">
                      <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" />
                      <span>Conceptual Hint</span>
                    </div>

                    {fetchingHint ? (
                      <div className="flex items-center space-x-2 py-6 text-violet-400 text-xs">
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                        <span>Querying AI Placement Tutor...</span>
                      </div>
                    ) : (
                      <p className="text-xs text-violet-200 leading-relaxed italic">
                        "{hintText || 'I am ready to help you analyze logic. Click below to retrieve a conceptual tip.'}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={getAIHint}
                    disabled={fetchingHint}
                    className="w-full py-2.5 rounded-xl border border-violet-800 bg-violet-950/20 text-violet-300 hover:text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer hover:bg-violet-900/10"
                  >
                    <HelpCircle className="h-4.5 w-4.5 text-violet-400" />
                    <span>Generate another hint</span>
                  </button>
                </div>
              )}

              {leftTab === 'notes' && (
                /* Private Revision Notes Vault */
                <div className="space-y-3 flex flex-col h-full">
                  <div className="p-4 rounded-2xl border border-violet-950 bg-[#120a2e]/30 flex-1 flex flex-col space-y-3">
                    <div className="flex justify-between items-center border-b border-violet-950/40 pb-2">
                      <span className="text-violet-400 font-extrabold uppercase text-[10px] font-mono tracking-wider flex items-center space-x-1">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Revision Notes Vault</span>
                      </span>
                      <span className="text-[9px] text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-950/60 uppercase font-mono tracking-wider">
                        Auto-saved
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-violet-300 leading-normal">
                      Jot down optimal algorithms, corner cases (e.g. empty arrays, negative inputs), and recursion base conditions for future revision.
                    </p>
                    
                    <textarea
                      value={problemNotes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Type your notes here... (e.g. Use HashMap for constant lookup. Handle single-element list edgecase.)"
                      className="w-full flex-1 min-h-[220px] bg-black/40 text-violet-100 p-3 rounded-xl border border-violet-950 focus:border-violet-650 focus:outline-none text-xs leading-relaxed resize-none font-sans"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Editor & Terminal */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
            
            {/* Editor Console wrapper */}
            <div className="flex-1 glass-panel border-violet-950 flex flex-col overflow-hidden min-h-0">
              {/* Language selection header */}
              <div className="flex justify-between items-center bg-[#0a051d]/60 border-b border-violet-950/30 p-2.5 shrink-0">
                <div className="flex items-center space-x-1.5 text-xs text-white font-bold font-mono uppercase tracking-wider">
                  <CodeIcon className="h-4 w-4 text-violet-400" />
                  <span>Code Editor</span>
                </div>

                <select
                  value={ideLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-[#0b0717] text-white border border-violet-950 focus:border-violet-500 focus:outline-none text-[11px] rounded-lg px-2.5 py-1.5 transition font-semibold"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>

              {/* Text Editor Container with line numbers */}
              <div className="flex-1 flex bg-[#07040e]/60 font-mono text-[11.5px] min-h-0 overflow-hidden relative">
                {/* Line Numbers Column */}
                <div className="bg-[#0a051d]/40 text-violet-600/50 py-4 px-2.5 text-right select-none shrink-0 border-r border-violet-950/20 w-11 overflow-hidden">
                  {Array.from({ length: lineCount }).map((_, i) => (
                    <div key={i} className="h-5 leading-5">{i + 1}</div>
                  ))}
                </div>
                {/* Textarea Input */}
                <textarea
                  value={editorCode}
                  onChange={(e) => setEditorCode(e.target.value)}
                  placeholder="// Write your solution function here..."
                  className="flex-1 bg-transparent text-violet-200 p-4 focus:outline-none resize-none h-full leading-5 overflow-y-auto whitespace-pre font-mono tab-4"
                  style={{ tabSize: 4 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const start = e.currentTarget.selectionStart;
                      const end = e.currentTarget.selectionEnd;
                      const val = e.currentTarget.value;
                      setEditorCode(val.substring(0, start) + "    " + val.substring(end));
                      setTimeout(() => {
                        if (e.currentTarget) {
                          e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
                        }
                      }, 0);
                    }
                  }}
                />
              </div>
            </div>

            {/* BOTTOM PANEL: Execution Terminal Drawer */}
            <div className="h-[26vh] glass-panel border-violet-950 flex flex-col overflow-hidden shrink-0">
              {/* Console Tabs */}
              <div className="bg-[#0a051d]/60 border-b border-violet-950/30 p-2 flex space-x-2 shrink-0">
                <button
                  onClick={() => setConsoleTab('testcases')}
                  className={`px-3 py-1 rounded-lg text-[10px] uppercase font-mono tracking-wider font-semibold transition ${
                    consoleTab === 'testcases' 
                      ? 'bg-violet-950 border border-violet-850 text-white'
                      : 'text-violet-400 hover:text-white'
                  }`}
                >
                  Test Cases
                </button>
                <button
                  onClick={() => setConsoleTab('results')}
                  className={`px-3 py-1 rounded-lg text-[10px] uppercase font-mono tracking-wider font-semibold transition ${
                    consoleTab === 'results' 
                      ? 'bg-violet-950 border border-violet-850 text-white'
                      : 'text-violet-400 hover:text-white'
                  }`}
                >
                  Run Results
                </button>
                <button
                  onClick={() => setConsoleTab('report')}
                  className={`px-3 py-1 rounded-lg text-[10px] uppercase font-mono tracking-wider font-semibold transition flex items-center space-x-1 ${
                    consoleTab === 'report' 
                      ? 'bg-violet-950 border border-violet-850 text-white'
                      : 'text-violet-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-pink-400 animate-pulse" />
                  <span>AI Submit Report</span>
                </button>
              </div>

              {/* Console output display */}
              <div className="flex-1 p-4 overflow-y-auto text-xs font-mono bg-black/30">
                
                {/* 1. TEST CASES TAB */}
                {consoleTab === 'testcases' && (
                  <div className="space-y-3">
                    {selectedProblem.testCases && selectedProblem.testCases[0]?.args.length > 0 ? (
                      selectedProblem.testCases.map((tc: any, idx: number) => (
                        <div key={idx} className="flex flex-col space-y-1 bg-violet-950/15 border border-violet-950/30 p-2.5 rounded-xl">
                          <span className="text-[10px] text-violet-400 font-bold uppercase">Test Case {idx + 1}</span>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div><span className="text-violet-500 font-semibold">Args:</span> <code className="text-white">{JSON.stringify(tc.args)}</code></div>
                            <div><span className="text-pink-500 font-semibold">Expected:</span> <code className="text-white">{JSON.stringify(tc.expected)}</code></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-violet-400 italic">No static test cases defined. Click Submit to run via AI Edge Compiler.</p>
                    )}
                  </div>
                )}

                {/* 2. RUN RESULTS TAB */}
                {consoleTab === 'results' && (
                  <div className="space-y-2">
                    {!runResults ? (
                      <p className="text-[10px] text-violet-500 italic">No run logs yet. Click 'Run Code' to execute JavaScript test suites locally.</p>
                    ) : runResults.running ? (
                      <div className="flex items-center space-x-2 py-2 text-violet-400">
                        <Loader2 className="h-4.5 w-4.5 animate-spin text-violet-500" />
                        <span>Compiling JS sandbox test suites...</span>
                      </div>
                    ) : !runResults.success ? (
                      <div className="p-3 bg-rose-950/20 border border-rose-950 rounded-xl text-rose-400 space-y-1 text-[11px]">
                        <p className="font-bold">❌ Compilation / Runtime Exception:</p>
                        <p className="italic text-rose-300 whitespace-pre-wrap">{runResults.error}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {runResults.results.map((res: any) => (
                          <div 
                            key={res.caseNum} 
                            className={`flex justify-between items-center p-2.5 rounded-xl border text-[10px] ${
                              res.passed 
                                ? 'bg-emerald-950/10 border-emerald-950/40 text-emerald-400' 
                                : 'bg-rose-950/10 border-rose-950/40 text-rose-400'
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="font-bold uppercase tracking-wider block">Case {res.caseNum}</span>
                              <p><span className="opacity-70">Args:</span> <code className="text-white">{JSON.stringify(res.args)}</code></p>
                              <p><span className="opacity-70">Expected:</span> <code className="text-white">{JSON.stringify(res.expected)}</code></p>
                              <p><span className="opacity-70">Output:</span> <code className="text-white">{JSON.stringify(res.actual)}</code></p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold block uppercase">{res.passed ? 'Passed' : 'Failed'}</span>
                              <span className="text-[9px] opacity-75 font-mono">{res.duration}ms</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. AI SUBMIT REPORT TAB */}
                {consoleTab === 'report' && (
                  <div>
                    {!submitReport ? (
                      <p className="text-[10px] text-violet-500 italic">No reports generated. Click 'Submit Code' to run AI compilation critiques.</p>
                    ) : submitReport.loading ? (
                      <div className="flex flex-col space-y-2 py-4 items-center justify-center text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                        <span className="text-violet-400 text-xs animate-pulse">Running edge-case test validations & Big-O analyzer...</span>
                      </div>
                    ) : !submitReport.success ? (
                      <div className="p-3 bg-rose-950/20 border border-rose-950 rounded-xl text-rose-400 text-[11px]">
                        <p className="font-bold">❌ AI Evaluation Failed</p>
                        <p className="mt-1 text-rose-300">{submitReport.error}</p>
                      </div>
                    ) : (
                      /* Success scorecard output */
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Rating header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-violet-950/30 pb-3">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                              submitReport.data.status === 'Accepted' 
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' 
                                : 'bg-rose-950 text-rose-400 border border-rose-900/60'
                            }`}>
                              {submitReport.data.status}
                            </span>
                            <span className="text-xs text-white font-bold">Score: {submitReport.data.score}/100</span>
                          </div>
                          <div className="flex space-x-3 text-[10px]">
                            <div><span className="text-violet-400 font-mono">Time:</span> <code className="text-white font-bold">{submitReport.data.timeComplexity}</code></div>
                            <div><span className="text-pink-400 font-mono">Space:</span> <code className="text-white font-bold">{submitReport.data.spaceComplexity}</code></div>
                            {submitReport.data.beatsPercent && (
                              <div className="text-emerald-400 font-mono font-bold">Beats {submitReport.data.beatsPercent}%</div>
                            )}
                          </div>
                        </div>

                        {/* AI Critique feedback */}
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase tracking-wider text-violet-400 font-bold flex items-center space-x-1">
                            <Sparkles className="h-3 w-3 text-pink-400" />
                            <span>AI Code Critique</span>
                          </p>
                          <p className="text-xs text-violet-200 leading-relaxed italic">
                            "{submitReport.data.feedback}"
                          </p>
                        </div>

                        {/* Optimal code box with copy functionality */}
                        {submitReport.data.optimalCode && (
                          <div className="space-y-2 pt-2 border-t border-violet-950/20">
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] uppercase tracking-wider text-pink-400 font-bold">Optimal Code Suggestion:</p>
                              <span className="text-[9px] text-violet-400 font-mono italic">Complexity optimization</span>
                            </div>
                            
                            <div className="bg-[#0b0717]/80 rounded-xl p-3 border border-violet-950 font-mono text-[10px] text-violet-300 overflow-x-auto whitespace-pre-wrap max-h-[160px]">
                              <code>{submitReport.data.optimalCode}</code>
                            </div>
                            
                            {submitReport.data.optimalExplanation && (
                              <p className="text-[10px] text-violet-400 leading-relaxed mt-1">
                                <span className="font-bold text-white">Why it's better:</span> {submitReport.data.optimalExplanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* IDE compiler footer buttons */}
              <div className="bg-[#0a051d]/75 border-t border-violet-950/30 px-4 py-2.5 flex justify-between items-center shrink-0">
                <span className="text-[10px] text-violet-500 font-mono">
                  Press Submit to trigger AI Judge evaluations
                </span>

                <div className="flex space-x-2">
                  {ideLanguage === 'javascript' && (
                    <button
                      onClick={executeLocalJS}
                      disabled={ideLoading}
                      className="px-4 py-2 bg-violet-950/40 hover:bg-violet-900/30 border border-violet-850 text-violet-300 text-xs font-semibold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Run Code</span>
                    </button>
                  )}
                  
                  <button
                    onClick={submitToAIJudge}
                    disabled={ideLoading}
                    className="px-5 py-2 bg-gradient-to-r from-violet-600 to-pink-500 hover:brightness-110 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1 cursor-pointer shadow-lg shadow-violet-950/40"
                  >
                    {ideLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Submit Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
