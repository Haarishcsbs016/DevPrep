'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import {
  Module,
  Topic,
  Problem,
  Bookmark,
  Submission,
  RevisionProblem
} from './types';
import {
  Sparkles,
  Play,
  CheckCircle2,
  Bookmark as BookmarkIcon,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Send,
  ExternalLink,
  Loader2,
  History,
  Video,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

interface AIResponseData {
  mode: string;
  content: string;
  ragGrounded?: boolean;
  ragSources?: string[];
  ragEvidence?: string | null;
}

interface TestCaseResult {
  caseNumber?: number;
  passed?: boolean;
  args?: unknown[];
  expected?: unknown;
  actual?: unknown;
  error?: string;
  durationMs?: number;
}

interface RunResultData {
  status: string;
  passedTests?: number;
  totalTests?: number;
  runtimeMs?: number;
  testResults?: TestCaseResult[];
  error?: string;
}

interface SubmitReportData {
  status: string;
  passedTests?: number;
  totalTests?: number;
  runtimeMs?: number;
  feedback?: string;
  isNewSolve?: boolean;
  error?: string;
  testResults?: TestCaseResult[];
}

export default function DSALearningHub() {
  const { token, dsaProgress, setDSAProgress } = useStore();

  // Navigation & View state
  const [viewMode, setViewMode] = useState<'roadmap' | 'workspace'>('roadmap');
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks' | 'revision'>('all');

  // Curriculum data
  const [modules, setModules] = useState<Module[]>([]);
  const [totalProblemsInHub, setTotalProblemsInHub] = useState<number>(0);
  const [curriculumLoading, setCurriculumLoading] = useState<boolean>(true);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Solved' | 'Unsolved'>('All');

  // Bookmarks & Revision
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [revisionList, setRevisionList] = useState<{ bookmarked: Bookmark[]; failedToRetry: RevisionProblem[] }>({
    bookmarked: [],
    failedToRetry: []
  });

  // Workspace active selection
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(null);
  const [activeTopicData, setActiveTopicData] = useState<{ module: { id: number; title: string; slug: string }; topic: Topic } | null>(null);
  const [topicLoading, setTopicLoading] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  // Workspace Center Panel Tab: 'theory' | 'video' | 'ai'
  const [learnTab, setLearnTab] = useState<'theory' | 'video' | 'ai'>('theory');

  // Code Editor State
  const [ideLanguage, setIdeLanguage] = useState<string>('java');
  const [editorCode, setEditorCode] = useState<string>('');
  const [codeConsoleTab, setCodeConsoleTab] = useState<'testcases' | 'results' | 'report' | 'history'>('testcases');
  const [runningCode, setRunningCode] = useState(false);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [runResult, setRunResult] = useState<RunResultData | null>(null);
  const [submitReport, setSubmitReport] = useState<SubmitReportData | null>(null);
  const [problemSubmissions, setProblemSubmissions] = useState<Submission[]>([]);

  // Contextual AI Mentor State
  const [aiMode, setAiMode] = useState<'learn' | 'hint' | 'solution'>('learn');
  const [aiResponse, setAiResponse] = useState<AIResponseData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch initial curriculum and user progress
  const fetchCurriculum = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/dsa/curriculum');
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
        setTotalProblemsInHub(data.totalProblems || 0);
      }
    } catch (e) {
      console.warn('Failed to load curriculum:', e);
    } finally {
      setCurriculumLoading(false);
    }
  };

  const fetchProgress = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/dsa/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDSAProgress(data);
        } else {
          setDSAProgress([]);
        }
      }
    } catch (e) {
      console.warn('Failed to load progress:', e);
    }
  };

  const fetchBookmarks = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/dsa/bookmarks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarks(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Failed to load bookmarks:', e);
    }
  };

  const fetchRevision = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/dsa/revision', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRevisionList({
          bookmarked: Array.isArray(data?.bookmarked) ? data.bookmarked : [],
          failedToRetry: Array.isArray(data?.failedToRetry) ? data.failedToRetry : []
        });
      }
    } catch (e) {
      console.warn('Failed to load revision list:', e);
    }
  };

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      await fetchCurriculum();
      if (!ignore && token) {
        await Promise.all([fetchProgress(), fetchBookmarks(), fetchRevision()]);
      }
    };
    init();
    return () => {
      ignore = true;
    };
  }, [token]);

  // Solved problem titles set for instant O(1) checks
  const solvedProblemTitles = useMemo(() => {
    const titles = new Set<string>();
    const progressList = Array.isArray(dsaProgress) ? dsaProgress : [];
    progressList.forEach(p => {
      const solvedList = Array.isArray(p?.solvedProblems) ? p.solvedProblems : [];
      solvedList.forEach(sp => {
        if (sp?.title) {
          titles.add(sp.title.toLowerCase().trim());
        }
      });
    });
    return titles;
  }, [dsaProgress]);

  // Overall Statistics
  const totalSolvedCount = solvedProblemTitles.size;
  const progressPercentage = totalProblemsInHub > 0
    ? Math.min(100, Math.round((totalSolvedCount / totalProblemsInHub) * 100))
    : 0;

  // Toggle Module Accordion
  const toggleModule = (modId: number) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Open Workspace for a specific Topic
  const openTopicWorkspace = async (topicSlug: string, targetProblemId?: string) => {
    setSelectedTopicSlug(topicSlug);
    setViewMode('workspace');
    setTopicLoading(true);
    setRunResult(null);
    setSubmitReport(null);
    setAiResponse(null);

    try {
      const res = await fetch(`http://localhost:5000/api/dsa/topic/${topicSlug}`);
      if (res.ok) {
        const data = await res.json();
        setActiveTopicData(data);

        // Select problem if provided, else default to first linked problem
        const linked = data.topic.problems || [];
        if (targetProblemId) {
          const match = linked.find((p: Problem) => p.id === targetProblemId || p.slug === targetProblemId);
          if (match) loadProblemIntoEditor(match);
          else if (linked.length > 0) loadProblemIntoEditor(linked[0]);
        } else if (linked.length > 0) {
          loadProblemIntoEditor(linked[0]);
        } else {
          // Fallback: If no problem exists, load an interactive coding playground so compiler is always ready
          const playgroundProblem: Problem = {
            id: `playground-${data.topic.slug}`,
            slug: data.topic.slug,
            title: `${data.topic.title} Playground`,
            difficulty: data.topic.difficulty || 'Easy',
            topic: data.module.title,
            statement: `Interactive Code Playground for ${data.topic.title}. You can write, test, and run code directly in Java, Python, C++, or JavaScript.`,
            starterCode: data.topic.theory?.syntaxAndExamples || {
              java: `// Code Playground: ${data.topic.title}\nclass Solution {\n    public static void main(String[] args) {\n        System.out.println("Ready to code in Java!");\n    }\n}`,
              python: `# Code Playground: ${data.topic.title}\nprint("Ready to code in Python!")`,
              cpp: `// Code Playground: ${data.topic.title}\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Ready to code in C++!" << endl;\n    return 0;\n}`,
              javascript: `// Code Playground: ${data.topic.title}\nconsole.log("Ready to code in JavaScript!");`
            },
            sampleTestCases: []
          };
          loadProblemIntoEditor(playgroundProblem);
        }
      }
    } catch (e) {
      console.warn('Failed to load topic details:', e);
    } finally {
      setTopicLoading(false);
    }
  };

  // Load Problem into IDE
  const loadProblemIntoEditor = (problem: Problem) => {
    setSelectedProblem(problem);
    const defaultLang = 'java';
    setIdeLanguage(defaultLang);
    const starter = problem.starterCode?.[defaultLang] || '// Write your solution here';
    setEditorCode(starter);
    setRunResult(null);
    setSubmitReport(null);
    setCodeConsoleTab('testcases');
    fetchProblemSubmissions(problem.id);
  };

  const handleLanguageSelect = (lang: string) => {
    setIdeLanguage(lang);
    if (selectedProblem?.starterCode?.[lang]) {
      setEditorCode(selectedProblem.starterCode[lang]);
    }
  };

  // Fetch past submissions for selected problem
  const fetchProblemSubmissions = async (problemId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/dsa/submissions?problemId=${problemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        setProblemSubmissions(list);
      }
    } catch (e) {
      console.warn('Error fetching submissions:', e);
    }
  };

  // Run Code against sample test cases
  const handleRunCode = async () => {
    if (!selectedProblem) return;
    setRunningCode(true);
    setCodeConsoleTab('results');
    setRunResult(null);

    try {
      const res = await fetch('http://localhost:5000/api/dsa/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          language: ideLanguage,
          code: editorCode
        })
      });
      const data = await res.json();
      setRunResult(data);
    } catch (e: unknown) {
      setRunResult({ status: 'Runtime Error', error: (e as Error).message });
    } finally {
      setRunningCode(false);
    }
  };

  // Submit Solution for verified evaluation
  const handleSubmitCode = async () => {
    if (!selectedProblem) return;
    setSubmittingCode(true);
    setCodeConsoleTab('report');
    setSubmitReport(null);

    try {
      const res = await fetch('http://localhost:5000/api/dsa/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          topicSlug: activeTopicData?.topic.slug || '',
          language: ideLanguage,
          code: editorCode
        })
      });
      const data = await res.json();
      setSubmitReport(data);

      if (data.status === 'Accepted') {
        await fetchProgress();
      }
      await fetchProblemSubmissions(selectedProblem.id);
      await fetchRevision();
    } catch (e: unknown) {
      setSubmitReport({ status: 'Runtime Error', error: (e as Error).message });
    } finally {
      setSubmittingCode(false);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (problem: Problem) => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/dsa/bookmark/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          problemId: problem.id,
          problemTitle: problem.title,
          topicSlug: activeTopicData?.topic.slug || '',
          difficulty: problem.difficulty
        })
      });
      if (res.ok) {
        await fetchBookmarks();
        await fetchRevision();
      }
    } catch (e) {
      console.warn('Bookmark toggle error:', e);
    }
  };

  const isBookmarked = (problemId: string) => {
    return bookmarks.some(b => b.problemId === problemId);
  };

  // Trigger Contextual AI Mentor request
  const requestAiAssist = async (mode: 'learn' | 'hint' | 'solution') => {
    setAiMode(mode);
    setAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('http://localhost:5000/api/dsa/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mode,
          problemId: selectedProblem?.id,
          topicTitle: activeTopicData?.topic.title,
          code: editorCode,
          language: ideLanguage
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResponse(data);
      }
    } catch (e) {
      console.warn('AI assist failed:', e);
    } finally {
      setAiLoading(false);
    }
  };

  // Flattened topic list for Previous / Next navigation
  const allCurriculumTopics = useMemo(() => {
    return modules.flatMap(m => m.topics);
  }, [modules]);

  const currentTopicIndex = useMemo(() => {
    if (!selectedTopicSlug) return -1;
    return allCurriculumTopics.findIndex(t => t.slug === selectedTopicSlug);
  }, [allCurriculumTopics, selectedTopicSlug]);

  const handleNavigateTopic = (direction: 'prev' | 'next') => {
    if (currentTopicIndex === -1) return;
    const targetIdx = direction === 'prev' ? currentTopicIndex - 1 : currentTopicIndex + 1;
    if (targetIdx >= 0 && targetIdx < allCurriculumTopics.length) {
      openTopicWorkspace(allCurriculumTopics[targetIdx].slug);
    }
  };

  // Difficulty badge styling helper
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-violet-500/15 text-violet-400 border border-violet-500/30';
    }
  };

  // Filter modules/topics for display in Roadmap
  const filteredModules = useMemo(() => {
    return modules.map(m => {
      const matchingTopics = m.topics.filter(t => {
        // Query match
        const matchesQuery =
          !searchQuery.trim() ||
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.problems || []).some(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

        // Difficulty filter
        const matchesDiff = difficultyFilter === 'All' || t.difficulty === difficultyFilter;

        // Status filter
        let matchesStatus = true;
        if (statusFilter !== 'All') {
          const hasSolved = (t.problems || []).some(p => solvedProblemTitles.has(p.title.toLowerCase().trim()));
          if (statusFilter === 'Solved') matchesStatus = hasSolved;
          else if (statusFilter === 'Unsolved') matchesStatus = !hasSolved;
        }

        return matchesQuery && matchesDiff && matchesStatus;
      });

      return {
        ...m,
        topics: matchingTopics
      };
    }).filter(m => m.topics.length > 0 || !searchQuery.trim());
  }, [modules, searchQuery, difficultyFilter, statusFilter, solvedProblemTitles]);

  return (
    <div className="space-y-6 pb-16 text-slate-100">
      {/* View Mode 1: Comprehensive Roadmap */}
      {viewMode === 'roadmap' && (
        <div className="space-y-8">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-violet-900/40 bg-gradient-to-br from-[#120a2e] via-[#0d0722] to-[#070314] p-8 shadow-2xl">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-pink-600/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/60 px-3 py-1 text-xs font-semibold text-violet-300">
                  <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                  <span>Striver A2Z Roadmap Inspired • Original DevPrep AI Curriculum</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                  DSA Learning Hub
                </h1>
                <p className="text-sm leading-relaxed text-violet-200/80 md:text-base">
                  Master end-to-end Data Structures & Algorithms. Learn theory, watch curated tutorials, write code in Java with an interactive editor, and receive contextual AI mentor guidance.
                </p>
              </div>

              {/* Progress Summary Card */}
              <div className="flex flex-col gap-3 rounded-2xl border border-violet-800/40 bg-black/40 p-5 backdrop-blur-md md:min-w-72">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-violet-300">
                  <span>Overall Mastery</span>
                  <span className="text-pink-400 font-bold">{progressPercentage}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-violet-950">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-indigo-400 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs">
                  <div className="rounded-xl border border-violet-900/50 bg-violet-950/30 p-2">
                    <div className="text-lg font-bold text-white">{totalSolvedCount}</div>
                    <div className="text-[10px] text-violet-300/70">Solved Problems</div>
                  </div>
                  <div className="rounded-xl border border-violet-900/50 bg-violet-950/30 p-2">
                    <div className="text-lg font-bold text-white">{totalProblemsInHub}</div>
                    <div className="text-[10px] text-violet-300/70">Curriculum Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Filters & Shortcuts Navigation */}
          <div className="flex flex-col gap-4 rounded-2xl border border-violet-950/60 bg-[#0c071d]/80 p-4 shadow-lg md:flex-row md:items-center md:justify-between">
            {/* View Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-violet-900/30'
                    : 'text-violet-300 hover:bg-violet-950/40 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>All 18 Modules</span>
              </button>

              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeTab === 'bookmarks'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-violet-900/30'
                    : 'text-violet-300 hover:bg-violet-950/40 hover:text-white'
                }`}
              >
                <BookmarkIcon className="h-3.5 w-3.5 text-amber-400" />
                <span>Bookmarked ({bookmarks.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('revision')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeTab === 'revision'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-violet-900/30'
                    : 'text-violet-300 hover:bg-violet-950/40 hover:text-white'
                }`}
              >
                <History className="h-3.5 w-3.5 text-pink-400" />
                <span>Revision List ({revisionList.failedToRetry.length})</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-56 flex-1 md:flex-none">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-violet-400" />
                <input
                  type="text"
                  placeholder="Search topics, problems..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-violet-900/60 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder-violet-400/60 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <select
                value={difficultyFilter}
                onChange={e => setDifficultyFilter(e.target.value as 'All' | 'Easy' | 'Medium' | 'Hard')}
                className="rounded-xl border border-violet-900/60 bg-[#0a051d] px-3 py-1.5 text-xs text-violet-200 focus:border-violet-500 focus:outline-none"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'All' | 'Solved' | 'Unsolved')}
                className="rounded-xl border border-violet-900/60 bg-[#0a051d] px-3 py-1.5 text-xs text-violet-200 focus:border-violet-500 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Solved">Solved</option>
                <option value="Unsolved">Unsolved</option>
              </select>
            </div>
          </div>

          {/* Bookmarks Tab View */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookmarkIcon className="h-5 w-5 text-amber-400" />
                <span>Saved Bookmarks</span>
              </h2>
              {bookmarks.length === 0 ? (
                <div className="rounded-2xl border border-violet-950/80 bg-[#0a051d]/40 p-8 text-center text-xs text-violet-300">
                  No bookmarked problems yet. Click the bookmark icon on any problem to save it for quick revision.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {bookmarks.map(b => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between rounded-2xl border border-violet-900/40 bg-[#0f0927] p-4 transition hover:border-violet-600"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-white">{b.problemTitle}</div>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getDifficultyBadge(b.difficulty)}`}>
                          {b.difficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => openTopicWorkspace(b.topicSlug || 'arrays', b.problemId)}
                        className="rounded-xl bg-violet-600/30 px-3 py-1.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-600 hover:text-white"
                      >
                        Solve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Revision Tab View */}
          {activeTab === 'revision' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-pink-400" />
                <span>Problems Needing Revision & Retries</span>
              </h2>
              {revisionList.failedToRetry.length === 0 ? (
                <div className="rounded-2xl border border-violet-950/80 bg-[#0a051d]/40 p-8 text-center text-xs text-violet-300">
                  All attempted problems have been solved successfully! No pending retries.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {revisionList.failedToRetry.map(r => (
                    <div
                      key={r.problemId}
                      className="flex items-center justify-between rounded-2xl border border-rose-900/30 bg-[#16081e] p-4 transition hover:border-rose-600"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-white">{r.problemTitle}</div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getDifficultyBadge(r.difficulty)}`}>
                            {r.difficulty}
                          </span>
                          <span className="text-[10px] text-rose-400">Failed: {r.lastAttemptStatus}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openTopicWorkspace(r.topicSlug || 'arrays', r.problemId)}
                        className="rounded-xl bg-rose-600/30 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-600 hover:text-white"
                      >
                        Retry
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All 18 Modules View */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              {curriculumLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                </div>
              ) : (
                filteredModules.map(module => {
                  const isExpanded = !!expandedModules[module.id];
                  const moduleSolved = (module.topics || []).reduce((acc, t) => {
                    const count = (t.problems || []).filter(p => solvedProblemTitles.has(p.title.toLowerCase().trim())).length;
                    return acc + count;
                  }, 0);

                  return (
                    <div
                      key={module.id}
                      className="overflow-hidden rounded-2xl border border-violet-950/60 bg-[#0e0824]/90 transition shadow-md"
                    >
                      {/* Module Header Bar */}
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="flex w-full items-center justify-between p-5 text-left transition hover:bg-violet-950/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-900/40 font-mono text-sm font-bold text-violet-300 border border-violet-800/40">
                            {module.id}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-bold text-white md:text-lg">
                                {module.title}
                              </h3>
                              {module.problemsCount > 0 && (
                                <span className="rounded-full bg-violet-950 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                                  {moduleSolved}/{module.problemsCount} Solved
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-violet-300/70">
                              {module.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-violet-400/80">
                            {module.topics.length} topics
                          </span>
                          <div className="text-violet-400 transition-transform duration-200">
                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                          </div>
                        </div>
                      </button>

                      {/* Expandable Module Content */}
                      {isExpanded && (
                        <div className="border-t border-violet-950/40 bg-black/20 p-5">
                          {module.topics.length === 0 ? (
                            <div className="py-4 text-center text-xs text-violet-400/60">
                              Extensible module curriculum roadmap coming next in continuous updates.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {module.topics.map(topic => {
                                const solvedInTopic = (topic.problems || []).filter(p =>
                                  solvedProblemTitles.has(p.title.toLowerCase().trim())
                                ).length;

                                return (
                                  <div
                                    key={topic.id}
                                    className="group flex flex-col justify-between rounded-xl border border-violet-900/30 bg-[#130b30]/80 p-4 transition hover:border-violet-600/70 hover:bg-[#180e3c]"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getDifficultyBadge(topic.difficulty)}`}>
                                          {topic.difficulty}
                                        </span>
                                        <div className="flex items-center gap-1 text-[11px] text-violet-400">
                                          <Clock className="h-3 w-3" />
                                          <span>{topic.estimatedMinutes}m</span>
                                        </div>
                                      </div>

                                      <h4 className="text-sm font-bold text-white group-hover:text-pink-300 transition">
                                        {topic.title}
                                      </h4>
                                      <p className="text-xs leading-relaxed text-violet-200/70 line-clamp-2">
                                        {topic.summary}
                                      </p>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-violet-950/40 pt-3">
                                      <span className="text-[11px] font-medium text-violet-400">
                                        {topic.problems?.length || 0} Problems ({solvedInTopic} solved)
                                      </span>
                                      <button
                                        onClick={() => openTopicWorkspace(topic.slug)}
                                        className="flex items-center gap-1 text-xs font-bold text-violet-300 group-hover:text-white"
                                      >
                                        <span>Start</span>
                                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* View Mode 2: Dedicated 3-Panel Learning Workspace */}
      {viewMode === 'workspace' && (
        <div className="space-y-4">
          {/* Breadcrumbs & Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-900/40 bg-[#0f0927] p-4">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setViewMode('roadmap')}
                className="flex items-center gap-1 font-semibold text-violet-400 hover:text-white transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Roadmap</span>
              </button>
              <span className="text-violet-600">/</span>
              <span className="text-violet-300">{activeTopicData?.module?.title}</span>
              <span className="text-violet-600">/</span>
              <span className="font-bold text-white">{activeTopicData?.topic.title}</span>
              {selectedProblem && (
                <>
                  <span className="text-violet-600">/</span>
                  <span className="font-bold text-pink-400">{selectedProblem.title}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavigateTopic('prev')}
                disabled={currentTopicIndex <= 0}
                className="flex items-center gap-1 rounded-lg border border-violet-800/40 bg-violet-950/30 px-3 py-1.5 text-xs text-violet-300 disabled:opacity-40 transition hover:bg-violet-900/40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev Topic</span>
              </button>
              <button
                onClick={() => handleNavigateTopic('next')}
                disabled={currentTopicIndex >= allCurriculumTopics.length - 1}
                className="flex items-center gap-1 rounded-lg border border-violet-800/40 bg-violet-950/30 px-3 py-1.5 text-xs text-violet-300 disabled:opacity-40 transition hover:bg-violet-900/40"
              >
                <span>Next Topic</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {topicLoading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Panel: Topic Navigation & Problem Checklist (Cols 3) */}
              <div className="space-y-4 lg:col-span-3">
                <div className="rounded-2xl border border-violet-900/40 bg-[#0e0825] p-4 shadow-lg">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-3">
                    Problems in Topic
                  </h3>
                  <div className="space-y-2">
                    {(activeTopicData?.topic.problems || []).length === 0 ? (
                      <button
                        onClick={() => {
                          if (activeTopicData) {
                            openTopicWorkspace(activeTopicData.topic.slug);
                          }
                        }}
                        className="flex w-full items-center justify-between rounded-xl p-3 text-left transition bg-gradient-to-r from-violet-600/30 to-pink-600/20 border border-violet-500/50 text-white hover:border-pink-500"
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold">Interactive Playground</div>
                          <span className="inline-block rounded-full px-1.5 py-0.2 text-[9px] font-bold bg-violet-950 text-violet-300">
                            Playground
                          </span>
                        </div>
                        <Play className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                      </button>
                    ) : (
                      (activeTopicData?.topic.problems || []).map(prob => {
                        const isSolved = solvedProblemTitles.has(prob.title.toLowerCase().trim());
                        const isSelected = selectedProblem?.id === prob.id;

                        return (
                          <button
                            key={prob.id}
                            onClick={() => loadProblemIntoEditor(prob)}
                            className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition ${
                              isSelected
                                ? 'bg-gradient-to-r from-violet-600/40 to-pink-600/30 border border-violet-500 text-white'
                                : 'bg-black/30 border border-violet-950 hover:border-violet-800/60 text-violet-200'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="text-xs font-bold line-clamp-1">{prob.title}</div>
                              <span className={`inline-block rounded-full px-1.5 py-0.2 text-[9px] font-bold ${getDifficultyBadge(prob.difficulty)}`}>
                                {prob.difficulty}
                              </span>
                            </div>
                            {isSolved ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-violet-600/60 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Video Info Preview Box */}
                {activeTopicData?.topic.video && (
                  <div className="rounded-2xl border border-violet-900/40 bg-[#0e0825] p-4 shadow-lg space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                      <Video className="h-4 w-4 text-pink-400" />
                      <span>Curated Tutorial</span>
                    </div>
                    <p className="text-xs font-semibold text-white line-clamp-1">
                      {activeTopicData.topic.video.title}
                    </p>
                    <p className="text-[11px] text-violet-400">
                      Creator: {activeTopicData.topic.video.creator}
                    </p>
                    <button
                      onClick={() => setLearnTab('video')}
                      className="w-full mt-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-800/40 py-1.5 text-xs font-bold text-violet-200 transition"
                    >
                      Watch Tutorial
                    </button>
                  </div>
                )}
              </div>

              {/* Center Panel: Theory, Examples, Video, and Contextual AI (Cols 4) */}
              <div className="space-y-4 lg:col-span-4">
                <div className="flex rounded-xl border border-violet-900/40 bg-[#0e0825] p-1">
                  <button
                    onClick={() => setLearnTab('theory')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                      learnTab === 'theory' ? 'bg-violet-600 text-white' : 'text-violet-400 hover:text-white'
                    }`}
                  >
                    Theory
                  </button>
                  <button
                    onClick={() => setLearnTab('video')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                      learnTab === 'video' ? 'bg-violet-600 text-white' : 'text-violet-400 hover:text-white'
                    }`}
                  >
                    Video
                  </button>
                  <button
                    onClick={() => setLearnTab('ai')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                      learnTab === 'ai' ? 'bg-violet-600 text-white' : 'text-violet-400 hover:text-white'
                    }`}
                  >
                    AI Mentor
                  </button>
                </div>

                {/* Tab 1: Structured Theory & Walkthrough */}
                {learnTab === 'theory' && activeTopicData?.topic.theory && (
                  <div className="rounded-2xl border border-violet-900/40 bg-[#0e0825] p-5 shadow-lg space-y-4 max-h-[750px] overflow-y-auto">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400">
                        Concept Definition
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-violet-200">
                        {activeTopicData.topic.theory.conceptDefinition}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">
                        Why It Matters
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-violet-200/80">
                        {activeTopicData.topic.theory.whyItMatters}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">
                        Beginner-Friendly Explanation
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-violet-200/90 whitespace-pre-line">
                        {activeTopicData.topic.theory.explanation}
                      </p>
                    </div>

                    {/* Syntax Examples in Java */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">
                        Java Implementation Pattern
                      </h4>
                      <pre className="mt-1.5 overflow-x-auto rounded-xl border border-violet-950 bg-black/60 p-3 font-mono text-[11px] text-emerald-300">
                        {activeTopicData.topic.theory.syntaxAndExamples?.java || '// Code pattern'}
                      </pre>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">
                        Step-by-Step Walkthrough
                      </h4>
                      <ul className="mt-1.5 list-disc pl-4 space-y-1 text-xs text-violet-200/80">
                        {activeTopicData.topic.theory.walkthrough?.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                        Common Mistakes
                      </h4>
                      <ul className="mt-1.5 list-disc pl-4 space-y-1 text-xs text-rose-200/80">
                        {activeTopicData.topic.theory.commonMistakes?.map((mistake, idx) => (
                          <li key={idx}>{mistake}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-violet-900/30 bg-violet-950/30 p-3 text-xs text-violet-300">
                      <span className="font-bold text-white">Complexity: </span>
                      {activeTopicData.topic.theory.timeAndSpaceComplexity}
                    </div>
                  </div>
                )}

                {/* Tab 2: Embedded Video Player */}
                {learnTab === 'video' && (
                  <div className="rounded-2xl border border-violet-900/40 bg-[#0e0825] p-5 shadow-lg space-y-4">
                    {activeTopicData?.topic.video?.videoId ? (
                      <div className="space-y-3">
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-violet-950 bg-black">
                          <iframe
                            src={`https://www.youtube.com/embed/${activeTopicData.topic.video.videoId}`}
                            title={activeTopicData.topic.video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="h-full w-full border-0"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-violet-300">
                          <span>{activeTopicData.topic.video.title}</span>
                          <a
                            href={activeTopicData.topic.video.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-semibold text-pink-400 hover:underline"
                          >
                            <span>Open on YouTube</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-violet-400">
                        No video linked for this specific topic yet.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Contextual AI Assistant with RAG Integration */}
                {learnTab === 'ai' && (
                  <div className="rounded-2xl border border-violet-900/40 bg-[#0e0825] p-5 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-violet-950/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-pink-400" />
                        <span className="text-xs font-bold text-white">Contextual AI Assistant</span>
                      </div>
                      {aiResponse?.ragGrounded && (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          RAG Vault Grounded
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => requestAiAssist('learn')}
                        className={`rounded-lg py-1.5 text-xs font-bold transition border ${
                          aiMode === 'learn'
                            ? 'bg-violet-600/30 border-violet-500 text-white'
                            : 'border-violet-950 text-violet-400 hover:text-white'
                        }`}
                      >
                        Learn Mode
                      </button>
                      <button
                        onClick={() => requestAiAssist('hint')}
                        className={`rounded-lg py-1.5 text-xs font-bold transition border ${
                          aiMode === 'hint'
                            ? 'bg-violet-600/30 border-violet-500 text-white'
                            : 'border-violet-950 text-violet-400 hover:text-white'
                        }`}
                      >
                        Hint Mode
                      </button>
                      <button
                        onClick={() => requestAiAssist('solution')}
                        className={`rounded-lg py-1.5 text-xs font-bold transition border ${
                          aiMode === 'solution'
                            ? 'bg-violet-600/30 border-violet-500 text-white'
                            : 'border-violet-950 text-violet-400 hover:text-white'
                        }`}
                      >
                        Solution Mode
                      </button>
                    </div>

                    {aiLoading ? (
                      <div className="flex h-36 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
                      </div>
                    ) : aiResponse ? (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-violet-900/40 bg-black/40 p-4 text-xs leading-relaxed text-violet-100 whitespace-pre-line">
                          {aiResponse.content}
                        </div>
                        {aiResponse.ragSources && aiResponse.ragSources.length > 0 && (
                          <div className="text-[11px] text-violet-400">
                            Sources: {aiResponse.ragSources.join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-violet-400/80">
                        Choose a mode above to get instant contextual assistance for{' '}
                        <span className="text-white font-semibold">
                          {selectedProblem?.title || activeTopicData?.topic.title}
                        </span>.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Panel: Integrated Code Editor & Evaluation (Cols 5) */}
              <div className="space-y-4 lg:col-span-5">
                {selectedProblem ? (
                  <div className="rounded-2xl border border-violet-900/40 bg-[#0e0825] p-5 shadow-lg space-y-4">
                    {/* Problem Header */}
                    <div className="flex items-center justify-between border-b border-violet-950/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{selectedProblem.title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getDifficultyBadge(selectedProblem.difficulty)}`}>
                            {selectedProblem.difficulty}
                          </span>
                        </div>
                        <span className="text-[11px] text-violet-400">{selectedProblem.topic}</span>
                      </div>

                      <button
                        onClick={() => handleToggleBookmark(selectedProblem)}
                        className={`rounded-xl p-2 transition ${
                          isBookmarked(selectedProblem.id)
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-violet-950/50 text-violet-400 hover:text-white'
                        }`}
                        title="Bookmark for Revision"
                      >
                        <BookmarkIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Problem Statement Details */}
                    <div className="rounded-xl border border-violet-950 bg-black/30 p-3 text-xs leading-relaxed text-violet-200 space-y-2">
                      <p>{selectedProblem.statement}</p>
                      {selectedProblem.constraints && (
                        <div className="pt-1">
                          <span className="font-semibold text-violet-400">Constraints: </span>
                          <span className="font-mono text-[11px] text-slate-300">
                            {selectedProblem.constraints.join(' • ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Language Selector */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                        <span>Language:</span>
                        <div className="flex gap-1">
                          {['java', 'python', 'cpp', 'javascript'].map(lang => (
                            <button
                              key={lang}
                              onClick={() => handleLanguageSelect(lang)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition uppercase ${
                                ideLanguage === lang
                                  ? 'bg-pink-600 text-white'
                                  : 'bg-violet-950 text-violet-400 hover:text-white'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const starter = selectedProblem.starterCode?.[ideLanguage] || '';
                          setEditorCode(starter);
                        }}
                        className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-white"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset</span>
                      </button>
                    </div>

                    {/* Code Editor Box */}
                    <div className="relative rounded-xl border border-violet-900/60 bg-[#090417] p-2">
                      <textarea
                        value={editorCode}
                        onChange={e => setEditorCode(e.target.value)}
                        rows={14}
                        spellCheck={false}
                        className="w-full resize-y bg-transparent p-2 font-mono text-xs text-emerald-300 focus:outline-none"
                      />
                    </div>

                    {/* Actions: Run & Submit */}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleRunCode}
                        disabled={runningCode || submittingCode}
                        className="flex items-center gap-1.5 rounded-xl border border-violet-700 bg-violet-950/60 px-4 py-2 text-xs font-bold text-violet-200 transition hover:bg-violet-900/60 disabled:opacity-50"
                      >
                        {runningCode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        <span>Run Code</span>
                      </button>

                      <button
                        onClick={handleSubmitCode}
                        disabled={runningCode || submittingCode}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-pink-900/20 transition hover:opacity-90 disabled:opacity-50"
                      >
                        {submittingCode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        <span>Submit Solution</span>
                      </button>
                    </div>

                    {/* Console & Results Panel */}
                    <div className="rounded-xl border border-violet-950 bg-black/40 p-4 space-y-3">
                      <div className="flex border-b border-violet-950/60 pb-2 text-xs font-bold">
                        <button
                          onClick={() => setCodeConsoleTab('testcases')}
                          className={`mr-4 transition ${codeConsoleTab === 'testcases' ? 'text-white border-b-2 border-violet-500' : 'text-violet-400'}`}
                        >
                          Sample Cases
                        </button>
                        <button
                          onClick={() => setCodeConsoleTab('results')}
                          className={`mr-4 transition ${codeConsoleTab === 'results' ? 'text-white border-b-2 border-violet-500' : 'text-violet-400'}`}
                        >
                          Run Results
                        </button>
                        <button
                          onClick={() => setCodeConsoleTab('report')}
                          className={`mr-4 transition ${codeConsoleTab === 'report' ? 'text-white border-b-2 border-violet-500' : 'text-violet-400'}`}
                        >
                          Submission Report
                        </button>
                        <button
                          onClick={() => setCodeConsoleTab('history')}
                          className={`transition ${codeConsoleTab === 'history' ? 'text-white border-b-2 border-violet-500' : 'text-violet-400'}`}
                        >
                          History ({problemSubmissions.length})
                        </button>
                      </div>

                      {/* Sample Cases */}
                      {codeConsoleTab === 'testcases' && (
                        <div className="space-y-2 text-xs">
                          {(selectedProblem.examples || []).map((ex, idx) => (
                            <div key={idx} className="rounded-lg border border-violet-950 bg-black/60 p-2 font-mono text-[11px]">
                              <div className="text-violet-400">Input: <span className="text-white">{ex.input}</span></div>
                              <div className="text-violet-400">Expected: <span className="text-emerald-400">{ex.output}</span></div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Run Results */}
                      {codeConsoleTab === 'results' && (
                        <div>
                          {runResult ? (
                            <div className="space-y-3 text-xs">
                              <div className="flex items-center justify-between border-b border-violet-900/40 pb-2">
                                <span className={`font-bold text-sm ${runResult.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {runResult.status} ({Number(runResult.passedTests || 0)}/{Number(runResult.totalTests || 0)} Passed)
                                </span>
                                {runResult.runtimeMs !== undefined && <span className="text-violet-400 font-mono">{runResult.runtimeMs}ms</span>}
                              </div>
                              {runResult.error && (
                                <div className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 font-mono text-[11px] text-rose-300 whitespace-pre-wrap">
                                  {runResult.error}
                                </div>
                              )}
                              {(Array.isArray(runResult.testResults) ? runResult.testResults : []).map((tr, idx) => (
                                <div key={idx} className="rounded-lg border border-violet-900/60 bg-black/60 p-2.5 font-mono text-[11px] space-y-1">
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className="text-violet-300">Test Case {tr.caseNumber || idx + 1}</span>
                                    <span className={tr.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                      {tr.passed ? '✓ Passed' : '✗ Failed'}
                                    </span>
                                  </div>
                                  {tr.args !== undefined && (
                                    <div className="text-zinc-400">
                                      <span className="text-violet-400">Input: </span>
                                      <span className="text-zinc-200">{JSON.stringify(tr.args)}</span>
                                    </div>
                                  )}
                                  {tr.expected !== undefined && (
                                    <div className="text-zinc-400">
                                      <span className="text-emerald-400">Expected: </span>
                                      <span className="text-emerald-300">{JSON.stringify(tr.expected)}</span>
                                    </div>
                                  )}
                                  {tr.actual !== undefined && (
                                    <div className="text-zinc-400">
                                      <span className={tr.passed ? 'text-emerald-400' : 'text-rose-400'}>Output: </span>
                                      <span className={tr.passed ? 'text-zinc-200' : 'text-rose-300'}>{JSON.stringify(tr.actual)}</span>
                                    </div>
                                  )}
                                  {tr.error && (
                                    <div className="text-rose-400 text-[10px]">Error: {tr.error}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-violet-400/70">Click &quot;Run Code&quot; to test against practice cases.</div>
                          )}
                        </div>
                      )}

                      {/* Submission Report */}
                      {codeConsoleTab === 'report' && (
                        <div>
                          {submitReport ? (
                            <div className="space-y-3 text-xs">
                              <div className="flex items-center justify-between border-b border-violet-900/40 pb-2">
                                <span className={`font-bold text-sm ${submitReport.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {String(submitReport.status || '')}
                                </span>
                                <span className="text-violet-400 font-mono">{Number(submitReport.passedTests || 0)}/{Number(submitReport.totalTests || 0)} Test Cases Passed</span>
                              </div>
                              <p className="text-violet-200 font-medium">{String(submitReport.feedback || '')}</p>
                              {submitReport.error && (
                                <div className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 font-mono text-[11px] text-rose-300 whitespace-pre-wrap">
                                  {submitReport.error}
                                </div>
                              )}
                              {Boolean(submitReport.isNewSolve) && (
                                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-2 text-emerald-300 font-bold text-center">
                                  🎉 +1 Problem Recorded in Progress!
                                </div>
                              )}
                              {(Array.isArray(submitReport.testResults) && submitReport.testResults.length > 0) && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">Test Cases Breakdown</div>
                                  {submitReport.testResults.map((tr, idx) => (
                                    <div key={idx} className="rounded-lg border border-violet-950 bg-black/60 p-2 font-mono text-[11px] flex justify-between items-center">
                                      <span className="text-zinc-300">Case {tr.caseNumber || idx + 1}</span>
                                      <span className={tr.passed ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                        {tr.passed ? '✓ Passed' : '✗ Failed'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-violet-400/70">Click &quot;Submit Solution&quot; for full automated evaluation.</div>
                          )}
                        </div>
                      )}

                      {/* Submission History */}
                      {codeConsoleTab === 'history' && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {problemSubmissions.length === 0 ? (
                            <div className="text-xs text-violet-400/70">No past submissions yet.</div>
                          ) : (
                            problemSubmissions.map(sub => (
                              <div key={sub._id} className="flex items-center justify-between rounded-lg border border-violet-950 bg-black/40 p-2 text-[11px]">
                                <div className="flex items-center gap-2">
                                  <span className={sub.status === 'Accepted' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                    {sub.status}
                                  </span>
                                  <span className="text-violet-400 font-mono uppercase">{sub.language}</span>
                                </div>
                                <span className="text-violet-500">
                                  {new Date(sub.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-violet-900/40 bg-[#0e0825] p-12 text-center text-xs text-violet-400">
                    Select a coding problem from the left panel to begin practice.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
