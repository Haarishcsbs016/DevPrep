'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Sparkles, 
  BookOpen, 
  Award,
  Loader2,
  RefreshCw,
  GitBranch,
  Code2,
  FileText,
  Mic,
  Activity,
  ArrowRight,
  Target,
  Briefcase,
  GraduationCap,
  Flame,
  CheckCircle2,
  Building,
  Check,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface RoadmapItem {
  week: string;
  title: string;
  tasks: string[];
}

export default function Dashboard() {
  const { token, user, setUser, dsaProgress, setDSAProgress, interviews, setInterviews, resumes, setResumes, geminiKey } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'dsa' | 'interviews' | 'roadmap'>('overview');
  
  // Placement readiness states
  const [readinessScore, setReadinessScore] = useState(65);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [dailyTasks, setDailyTasks] = useState<string[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);

  // Roadmap calculations and logic
  const handleToggleRoadmapTask = async (weekName: string, taskText: string) => {
    if (!user) return;
    const taskKey = `${weekName}||${taskText}`;
    const currentCompleted = user.completedRoadmapTasks || [];
    const isCompleted = currentCompleted.includes(taskKey);
    
    let nextCompleted: string[];
    if (isCompleted) {
      nextCompleted = currentCompleted.filter((t: string) => t !== taskKey);
    } else {
      nextCompleted = [...currentCompleted, taskKey];
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          completedRoadmapTasks: nextCompleted
        })
      });
      
      if (response.ok) {
        setUser({
          ...user,
          completedRoadmapTasks: nextCompleted
        });
      }
    } catch (error) {
      console.error("Error updating roadmap task:", error);
    }
  };

  const getWeekStatus = (weekIdx: number) => {
    if (roadmap.length === 0) return 'locked';
    
    const weekCompletedStates = roadmap.map((week) => {
      if (!week.tasks || week.tasks.length === 0) return true;
      return week.tasks.every(task => {
        const taskKey = `${week.week}||${task}`;
        return (user?.completedRoadmapTasks || []).includes(taskKey);
      });
    });
    
    if (weekCompletedStates[weekIdx]) {
      return 'completed';
    }
    
    const activeWeekIdx = weekCompletedStates.indexOf(false);
    
    if (weekIdx === activeWeekIdx) {
      return 'active';
    }
    
    if (weekIdx > activeWeekIdx) {
      return 'locked';
    }
    
    return 'locked';
  };

  const fetchBackendData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [dsaRes, interviewRes, resumeRes] = await Promise.all([
        fetch('http://localhost:5000/api/dsa/progress', { headers }),
        fetch('http://localhost:5000/api/interviews/history', { headers }),
        fetch('http://localhost:5000/api/resume/history', { headers })
      ]);

      const dsaData = await dsaRes.json();
      const interviewData = await interviewRes.json();
      const resumeData = await resumeRes.json();

      setDSAProgress(dsaData);
      setInterviews(interviewData);
      setResumes(resumeData);

      // Call FastAPI for unified readiness estimation
      const aiHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (geminiKey) {
        aiHeaders['X-Gemini-Key'] = geminiKey;
      }

      const readinessRes = await fetch('http://localhost:8000/readiness-score', {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({
          profile: user?.profile || {},
          dsaProgress: dsaData || [],
          resumeReports: resumeData || [],
          interviewHistory: interviewData || []
        })
      });

      const readinessData = await readinessRes.json();
      setReadinessScore(Number(readinessData.placementReadinessScore) || 0);
      setWeaknesses(readinessData.weaknessAnalysis || []);
      setDailyTasks(readinessData.dailyTasks || []);
      setRoadmap(readinessData.roadmap || []);

    } catch (error) {
      console.warn("Dashboard synchronization warning:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBackendData().finally(() => setLoading(false));
    }
  }, [token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBackendData();
    setRefreshing(false);
  };

  const toggleTask = (idx: number) => {
    setCheckedTasks(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <p className="text-sm text-violet-400">Syncing placement metrics & AI Engines...</p>
        </div>
      </div>
    );
  }

  // Pre-calculations & metrics mapping
  const safeProgress = Array.isArray(dsaProgress) ? dsaProgress : [];
  const totalSolved = safeProgress.reduce((acc, t) => acc + (t.solvedCount || 0), 0);
  const activeStreak = safeProgress.reduce((max, t) => Math.max(max, t.streak || 0), 0);
  
  // Difficulty Breakdown
  const allSolvedProblems = safeProgress.flatMap(p => p.solvedProblems || []);
  const easyCount = allSolvedProblems.filter(p => p.difficulty === 'Easy').length;
  const mediumCount = allSolvedProblems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = allSolvedProblems.filter(p => p.difficulty === 'Hard').length;
  
  // Resume Metrics
  const latestResume = Array.isArray(resumes) && resumes.length > 0 ? resumes[0] : null;
  const atsScore = latestResume ? latestResume.atsScore : 0;
  const missingKeywordsCount = latestResume?.missingKeywords?.length || 0;

  // Interview Metrics
  const completedInterviews = Array.isArray(interviews) ? interviews.filter(i => i.status === 'completed') : [];
  const totalInterviewsCount = completedInterviews.length;
  const latestInterview = completedInterviews[0];
  const avgTechScore = completedInterviews.length > 0 
    ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.overallFeedback?.technicalScore || 0), 0) / completedInterviews.length) 
    : 0;
  const avgCommScore = completedInterviews.length > 0 
    ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.overallFeedback?.communicationScore || 0), 0) / completedInterviews.length) 
    : 0;

  // Map Recharts Data
  const radarData = safeProgress.map(topic => ({
    subject: topic.topic,
    solved: Math.min((Number(topic.solvedCount) || 0) * 20, 100),
    fullMark: 100
  }));

  const barData = completedInterviews.slice(0, 4).reverse().map((session, idx) => ({
    name: `Round ${idx + 1} (${session.type})`,
    tech: Number(session.overallFeedback?.technicalScore) || 0,
    comm: Number(session.overallFeedback?.communicationScore) || 0
  }));

  // Recruitment Funnel calculation
  const funnelStages = [
    { id: 1, label: 'Profile Built', check: true, description: 'Interests set' },
    { id: 2, label: 'Resume ATS Ready', check: atsScore >= 70, description: 'Score ≥ 70%' },
    { id: 3, label: 'DSA Foundation', check: totalSolved >= 8, description: 'Solved 8+ problems' },
    { id: 4, label: 'Interview Competent', check: avgTechScore >= 70 || totalInterviewsCount >= 1, description: '1+ Completed Round' },
    { id: 5, label: 'Placement Certified', check: readinessScore >= 75, description: 'Score ≥ 75%' }
  ];

  // Dynamic Company Readiness Alignment
  const targetCompanies = user?.profile?.targetCompanies || ['General Tech'];
  const targetRole = user?.profile?.targetRole || 'Software Development Engineer';

  // Build simulated activity log based on actual database states
  const activityLogs = [];
  if (totalSolved > 0) {
    activityLogs.push({
      id: 'dsa',
      title: `Solved ${totalSolved} algorithm problems`,
      meta: `Latest: ${allSolvedProblems[0]?.title || 'Two Sum'}`,
      time: allSolvedProblems[0] ? new Date(allSolvedProblems[0].solvedAt).toLocaleDateString() : 'Active',
      color: 'bg-violet-500'
    });
  }
  if (latestResume) {
    activityLogs.push({
      id: 'resume',
      title: `Resume scanned by ATS intelligence`,
      meta: `ATS Score: ${atsScore}% | Keyword gaps parsed`,
      time: new Date(latestResume.createdAt).toLocaleDateString(),
      color: 'bg-emerald-500'
    });
  }
  if (latestInterview) {
    activityLogs.push({
      id: 'interview',
      title: `Finished voice mock interview round`,
      meta: `${latestInterview.company} (${latestInterview.type}) - Tech Score: ${latestInterview.overallFeedback?.technicalScore}%`,
      time: new Date(latestInterview.createdAt).toLocaleDateString(),
      color: 'bg-pink-500'
    });
  }
  activityLogs.push({
    id: 'profile',
    title: 'Configured career preferences & targets',
    meta: `Targeting: ${targetRole} roles`,
    time: 'Onboarded',
    color: 'bg-indigo-500'
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-violet-400 bg-violet-950/40 px-3 py-1 rounded-full border border-violet-900/30">
            System Workspace Connected
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-2">
            <span>Welcome back, {user?.name || 'Engineer'}</span>
            <motion.span 
              animate={{ rotate: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="inline-block origin-bottom-right"
            >
              👋
            </motion.span>
          </h2>
          <p className="text-xs text-violet-300 mt-1">
            Analyzing placement readiness for <span className="text-pink-400 font-semibold">{targetRole}</span> role.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-violet-400 hidden sm:inline-block">
            Last Synced: {new Date().toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-violet-950/40 border border-violet-800/40 text-violet-300 text-xs font-semibold hover:text-white hover:border-violet-650 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync OS Status</span>
          </button>
        </div>
      </div>

      {/* 2. Core KPI Metric Ribbon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Placement Readiness */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-5 border-violet-950 relative overflow-hidden flex flex-col justify-between h-48"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-600/10 to-transparent rounded-full filter blur-xl"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-violet-400 flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              <span>Readiness Rating</span>
            </span>
            <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-bold border ${
              readinessScore >= 80 ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/60' :
              readinessScore >= 60 ? 'text-amber-400 bg-amber-950/20 border-amber-900/60' :
              'text-rose-400 bg-rose-950/20 border-rose-900/60'
            }`}>
              {readinessScore >= 80 ? 'Tier-1 Elite' : readinessScore >= 60 ? 'Competitive' : 'Developing'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-2">
            <h3 className="text-4xl font-black text-white">{readinessScore}%</h3>
            <span className="text-xs text-violet-400">overall match</span>
          </div>

          <div className="w-full bg-[#0f0a28] h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-pink-500 transition-all duration-1000" 
              style={{ width: `${readinessScore}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-violet-400 leading-normal">
            Target benchmark: 80%+ for Tier 1 references.
          </p>
        </motion.div>

        {/* KPI 2: DSA Progress */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-5 border-violet-950 relative overflow-hidden flex flex-col justify-between h-48"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-600/10 to-transparent rounded-full filter blur-xl"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 flex items-center gap-1">
              <Code2 className="h-3.5 w-3.5" />
              <span>DSA Coding Progress</span>
            </span>
            <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full text-indigo-300 bg-indigo-950/20 border border-indigo-900/60 flex items-center gap-1">
              <Flame className="h-3 w-3 text-pink-500 fill-pink-500 animate-pulse" />
              <span>{activeStreak}d Streak</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-2">
            <h3 className="text-4xl font-black text-white">{totalSolved}</h3>
            <span className="text-xs text-violet-400">solved sums</span>
          </div>

          <div className="w-full bg-[#0f0a28] h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000" 
              style={{ width: `${Math.min((totalSolved / 40) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-violet-400 flex justify-between">
            <span>Progress: {totalSolved}/40 recommended</span>
            <a href="/dsa" className="text-indigo-400 hover:underline flex items-center">Open lists →</a>
          </p>
        </motion.div>

        {/* KPI 3: Resume ATS */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-5 border-violet-950 relative overflow-hidden flex flex-col justify-between h-48"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-600/10 to-transparent rounded-full filter blur-xl"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span>Resume ATS Rating</span>
            </span>
            <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border ${
              atsScore >= 75 ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/60' : 'text-amber-400 bg-amber-950/20 border-amber-900/60'
            }`}>
              {atsScore ? `${atsScore}/100` : 'Scan Pending'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-2">
            <h3 className="text-4xl font-black text-white">{atsScore || 'N/A'}%</h3>
            <span className="text-xs text-violet-400">{missingKeywordsCount} keyword gaps</span>
          </div>

          <div className="w-full bg-[#0f0a28] h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000" 
              style={{ width: `${atsScore || 0}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-violet-400 flex justify-between">
            <span>ATS Engine Scan</span>
            <a href="/resume" className="text-emerald-400 hover:underline flex items-center">Optimize Resume →</a>
          </p>
        </motion.div>

        {/* KPI 4: Interview Performance */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-5 border-violet-950 relative overflow-hidden flex flex-col justify-between h-48"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-600/10 to-transparent rounded-full filter blur-xl"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-pink-400 flex items-center gap-1">
              <Mic className="h-3.5 w-3.5" />
              <span>Mock Interview Prep</span>
            </span>
            <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full text-pink-300 bg-pink-950/20 border border-pink-900/60">
              {totalInterviewsCount} Session(s)
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-2">
            <h3 className="text-4xl font-black text-white">
              {totalInterviewsCount > 0 ? `${Math.round((avgTechScore + avgCommScore) / 2)}%` : 'N/A'}
            </h3>
            <span className="text-xs text-violet-400">average evaluation</span>
          </div>

          <div className="w-full bg-[#0f0a28] h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-pink-500 transition-all duration-1000" 
              style={{ width: `${totalInterviewsCount > 0 ? (avgTechScore + avgCommScore) / 2 : 0}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-violet-400 flex justify-between">
            <span>Tech: {avgTechScore}% | Comm: {avgCommScore}%</span>
            <a href="/interview" className="text-pink-400 hover:underline flex items-center">Practice Mock →</a>
          </p>
        </motion.div>
      </div>

      {/* 3. Recruitment Pipeline Funnel Tracker */}
      <div className="glass-panel p-6 border-violet-950">
        <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-5 flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-violet-400" />
          <span>Placement Pipeline Funnel Tracking</span>
        </h3>
        
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 relative w-full pt-2">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-[22px] left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-violet-600 via-pink-500 to-indigo-500 -z-10 opacity-30"></div>
          
          {funnelStages.map((stage, idx) => {
            const isCompleted = stage.check;
            const isActive = !isCompleted && (idx === 0 || funnelStages[idx - 1].check);
            
            return (
              <div key={stage.id} className="flex lg:flex-col items-center gap-4 lg:gap-2 lg:text-center w-full lg:w-1/5 select-none z-10">
                {/* Node circle */}
                <div className={`h-10 w-10 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-500 text-white shadow-lg shadow-emerald-950/40' 
                    : isActive 
                    ? 'bg-violet-950 border-violet-500 text-violet-400 shadow-md shadow-violet-950/70 scale-110 animate-pulse'
                    : 'bg-[#0f0a28]/60 border-violet-950/50 text-violet-600'
                }`}>
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[3]" />
                  ) : (
                    <span className="text-xs font-mono font-bold">{stage.id}</span>
                  )}
                </div>
                
                {/* Node details */}
                <div className="text-left lg:text-center">
                  <h4 className={`text-xs font-bold transition-all ${
                    isCompleted ? 'text-white' : isActive ? 'text-violet-300' : 'text-violet-500'
                  }`}>{stage.label}</h4>
                  <p className="text-[10px] text-violet-400 font-mono mt-0.5">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Switchable Tabs Console */}
      <div className="space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-violet-950/40 p-1 bg-[#120c26]/20 rounded-xl max-w-md">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'overview' 
                ? 'bg-violet-950/60 border border-violet-850 text-white shadow-md shadow-violet-950/40' 
                : 'text-violet-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('dsa')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'dsa' 
                ? 'bg-violet-950/60 border border-violet-850 text-white shadow-md shadow-violet-950/40' 
                : 'text-violet-400 hover:text-white'
            }`}
          >
            DSA Coverage
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'interviews' 
                ? 'bg-violet-950/60 border border-violet-850 text-white shadow-md shadow-violet-950/40' 
                : 'text-violet-400 hover:text-white'
            }`}
          >
            Interview Trend
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'roadmap' 
                ? 'bg-violet-950/60 border border-violet-850 text-white shadow-md shadow-violet-950/40' 
                : 'text-violet-400 hover:text-white'
            }`}
          >
            Weekly Roadmap
          </button>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* TABS 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Daily Tasks List */}
                <div className="lg:col-span-2 glass-panel p-6 border-violet-950 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-violet-950/30 pb-3">
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center space-x-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Dynamic Daily Action Items</span>
                      </h3>
                      <span className="text-[9px] text-pink-400 font-semibold bg-pink-950/20 border border-pink-900/30 px-2 py-0.5 rounded-full">
                        AI Recommended
                      </span>
                    </div>

                    <div className="space-y-3">
                      {dailyTasks.length > 0 ? (
                        dailyTasks.map((task, idx) => {
                          const isChecked = !!checkedTasks[idx];
                          return (
                            <button
                              key={idx}
                              onClick={() => toggleTask(idx)}
                              className={`flex items-center space-x-3 w-full text-left p-3.5 rounded-xl border transition-all text-xs cursor-pointer ${
                                isChecked 
                                  ? 'bg-violet-950/20 border-violet-900/40 text-violet-400/70 line-through'
                                  : 'bg-[#161030]/50 border-violet-950 text-violet-200 hover:border-violet-900'
                              }`}
                            >
                              <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-all ${
                                isChecked 
                                  ? 'bg-violet-600 border-violet-500 text-white' 
                                  : 'border-violet-700 bg-black/30'
                              }`}>
                                {isChecked && (
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className="flex-1">{task}</span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-xs text-violet-400 text-center py-6">No tasks generated yet. Ensure you have filled profile settings.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-violet-400/80 mt-6 leading-relaxed bg-[#0f0a28]/60 p-3 rounded-xl border border-violet-950/30">
                    💡 **Recruitment OS Insight**: Solving LeetCode questions or submitting resumes will cause the AI system to refresh these tasks automatically.
                  </div>
                </div>

                {/* Right Column: Company Alignment & Activity logs */}
                <div className="space-y-6 lg:col-span-1">
                  {/* Dream Company alignment card */}
                  <div className="glass-panel p-6 border-violet-950">
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3 flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-violet-400" />
                      <span>Dream Company Readiness</span>
                    </h3>
                    
                    <div className="space-y-4">
                      {targetCompanies.map((company, index) => {
                        // Create simulated alignment factor based on readiness score
                        const alignment = Math.max(readinessScore - (index * 6), 25);
                        return (
                          <div key={company} className="space-y-1.5 p-3 rounded-xl border border-violet-950 bg-violet-950/20">
                            <div className="flex justify-between text-xs">
                              <span className="text-white font-bold flex items-center gap-1">
                                <Building className="h-3.5 w-3.5 text-violet-400" />
                                <span>{company}</span>
                              </span>
                              <span className="font-mono text-pink-400 font-bold">{alignment}% match</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#0f0a28] rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: `${alignment}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Activity Log */}
                  <div className="glass-panel p-6 border-violet-950">
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-violet-400" />
                      <span>OS System Event Log</span>
                    </h3>

                    <div className="relative pl-4 border-l border-violet-950/80 space-y-4">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="relative">
                          <div className={`absolute -left-[20px] top-1.5 h-2.5 w-2.5 rounded-full ${log.color} ring-4 ring-[#0b0717]`}></div>
                          <div className="text-xs">
                            <h4 className="text-white font-semibold">{log.title}</h4>
                            <p className="text-[10px] text-violet-400 mt-0.5">{log.meta}</p>
                            <span className="text-[9px] text-violet-500 font-mono block mt-1">{log.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DSA DETAILS */}
            {activeTab === 'dsa' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Radar chart */}
                <div className="lg:col-span-5 glass-panel p-6 border-violet-950 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3">
                      DSA Domain Radar
                    </h3>
                    <p className="text-[11px] text-violet-400 leading-normal mb-4">
                      Chart maps percentage coverage across core data structures. Target is balanced coverage above 60% on all axes.
                    </p>
                  </div>
                  
                  <div className="w-full h-64 flex items-center justify-center">
                    {radarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="rgba(139, 92, 246, 0.15)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(192, 132, 252, 0.7)', fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255, 255, 255, 0.4)' }} />
                          <Radar name="Coverage" dataKey="solved" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-violet-400">No coding history to chart yet.</p>
                    )}
                  </div>
                </div>

                {/* Topic Breakdown bars & Difficulty distribution */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Category detailed bars */}
                  <div className="glass-panel p-6 border-violet-950">
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3">
                      Data Structures category tracking
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {safeProgress.map(topic => {
                        const solved = topic.solvedCount || 0;
                        const percentage = Math.min((solved / 5) * 100, 100);
                        return (
                          <div key={topic._id} className="p-3 bg-violet-950/15 border border-violet-950 rounded-xl space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-white font-semibold">{topic.topic}</span>
                              <span className="text-violet-400 font-mono">{solved}/5 solved</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#0f0a28] rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-600 to-pink-500" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Difficulty profile card */}
                  <div className="glass-panel p-6 border-violet-950">
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3">
                      Solve Tier Breakdown
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-emerald-950/20 border border-emerald-950 rounded-2xl">
                        <span className="text-xs font-mono font-bold text-emerald-400 block uppercase">Easy</span>
                        <h4 className="text-2xl font-black text-white mt-1">{easyCount}</h4>
                      </div>
                      <div className="p-4 bg-amber-950/20 border border-amber-950 rounded-2xl">
                        <span className="text-xs font-mono font-bold text-amber-400 block uppercase">Medium</span>
                        <h4 className="text-2xl font-black text-white mt-1">{mediumCount}</h4>
                      </div>
                      <div className="p-4 bg-rose-950/20 border border-rose-950 rounded-2xl">
                        <span className="text-xs font-mono font-bold text-rose-400 block uppercase">Hard</span>
                        <h4 className="text-2xl font-black text-white mt-1">{hardCount}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INTERVIEW RATINGS */}
            {activeTab === 'interviews' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recharts Bar Chart */}
                <div className="lg:col-span-2 glass-panel p-6 border-violet-950">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-6 border-b border-violet-950/40 pb-3">
                    Mock interview ratings trend
                  </h3>

                  <div className="w-full h-64 flex items-center justify-center">
                    {barData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.4)" fontSize={9} />
                          <YAxis domain={[0, 100]} stroke="rgba(255, 255, 255, 0.4)" fontSize={9} />
                          <Tooltip contentStyle={{ backgroundColor: '#120a2e', borderColor: 'rgba(139, 92, 246, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '11px' }} />
                          <Bar dataKey="tech" name="Technical Score" fill="#c084fc" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="comm" name="Communication Score" fill="#f472b6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-violet-950 rounded-2xl w-full">
                        <p className="text-xs text-violet-400 mb-3">No completed interview rounds yet.</p>
                        <a href="/interview" className="px-4 py-2 bg-violet-900/30 hover:bg-violet-800/40 border border-violet-900/60 rounded-xl text-xs font-semibold text-violet-300">
                          Launch interview coach →
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key weakness analysis report */}
                <div className="lg:col-span-1 glass-panel p-6 border-violet-950 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>Weak Areas & Skills Gaps</span>
                    </h3>
                    
                    <div className="space-y-2.5">
                      {weaknesses.length > 0 ? (
                        weaknesses.map((weak, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-start space-x-2 px-3 py-2.5 rounded-xl bg-amber-950/20 border border-amber-950 text-amber-300 text-xs"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"></span>
                            <span>{weak}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-emerald-400 bg-emerald-950/20 rounded-xl border border-emerald-950">
                          Excellent status! No placement gaps flagged.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ROADMAP */}
            {activeTab === 'roadmap' && (
              <div className="space-y-6">
                {/* Visual Header / Progress Stats */}
                <div className="glass-panel p-6 border-violet-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-pink-500" />
                      <span>Adaptive Weekly Placement Roadmap</span>
                    </h3>
                    <p className="text-xs text-violet-400">
                      Tailored SDE prep plan targeting <span className="text-pink-400 font-semibold">{targetCompanies.join(', ')}</span> as a <span className="text-violet-300 font-semibold">{targetRole}</span>. Updates dynamically based on performance.
                    </p>
                  </div>

                  <div className="w-full md:w-80 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-violet-300">ROADMAP LEVEL PROGRESS</span>
                      <span className="text-pink-400 font-mono font-bold">
                        {(() => {
                          const tasks = roadmap.flatMap((w: RoadmapItem) => w.tasks.map((t: string) => `${w.week}||${t}`));
                          const total = tasks.length;
                          const completed = tasks.filter((t: string) => (user?.completedRoadmapTasks || []).includes(t)).length;
                          return total > 0 ? Math.round((completed / total) * 100) : 0;
                        })()}%
                      </span>
                    </div>
                    <div className="w-full bg-[#0a051d] h-2 rounded-full overflow-hidden border border-violet-950">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-600 to-pink-500 transition-all duration-500"
                        style={{ 
                          width: `${(() => {
                            const tasks = roadmap.flatMap((w: RoadmapItem) => w.tasks.map((t: string) => `${w.week}||${t}`));
                            const total = tasks.length;
                            const completed = tasks.filter((t: string) => (user?.completedRoadmapTasks || []).includes(t)).length;
                            return total > 0 ? (completed / total) * 100 : 0;
                          })()}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-violet-400">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-pink-500" />
                        <span>Active Streak: {activeStreak} days</span>
                      </span>
                      <span>Readiness score: {readinessScore}%</span>
                    </div>
                  </div>
                </div>

                {/* horizontal Simple Steps status bar */}
                <div className="glass-panel p-5 border-violet-950 flex justify-between items-center gap-4 select-none">
                  {roadmap.map((week, idx) => {
                    const status = getWeekStatus(idx);
                    return (
                      <div key={idx} className="flex items-center space-x-2 flex-1 justify-center first:justify-start last:justify-end">
                        <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-bold font-mono text-xs ${
                          status === 'completed' 
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                            : status === 'active'
                            ? 'bg-violet-950 border-pink-500 text-pink-400 animate-pulse ring-2 ring-pink-950'
                            : 'bg-[#0a051d]/80 border-violet-950 text-violet-600'
                        }`}>
                          {status === 'completed' ? '✓' : idx + 1}
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs font-bold text-white leading-none">{week.week}</p>
                          <p className="text-[9px] font-bold uppercase font-mono tracking-wider mt-0.5 leading-none">
                            {status === 'completed' ? (
                              <span className="text-emerald-400">Completed</span>
                            ) : status === 'active' ? (
                              <span className="text-pink-400">In Progress</span>
                            ) : (
                              <span className="text-violet-600">Locked</span>
                            )}
                          </p>
                        </div>
                        {idx < roadmap.length - 1 && (
                          <div className="hidden md:block flex-1 h-0.5 bg-violet-950 mx-4"></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Weekly Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                  {roadmap.length > 0 ? (
                    roadmap.map((week, idx) => {
                      const status = getWeekStatus(idx);
                      const isLocked = status === 'locked';
                      
                      return (
                        <div 
                          key={idx} 
                          className={`border rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                            isLocked 
                              ? 'bg-[#080414]/80 border-violet-950/60 opacity-45' 
                              : status === 'completed'
                              ? 'bg-[#0f0a28]/60 border-emerald-900/60 shadow-lg shadow-emerald-950/5'
                              : 'bg-[#120a2e]/60 border-violet-800/80 shadow-lg shadow-pink-950/5 scale-[1.02]'
                          }`}
                        >
                          {/* Locked Overlays */}
                          {isLocked && (
                            <div className="absolute inset-0 bg-[#06030ecc]/20 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 text-center p-4">
                              <Lock className="h-6 w-6 text-violet-600 mb-1" />
                              <span className="text-[10px] font-bold font-mono uppercase text-violet-500 tracking-wider">Locked</span>
                            </div>
                          )}

                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-2">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center font-extrabold text-xs text-white ${
                                  status === 'completed' 
                                    ? 'bg-emerald-600' 
                                    : 'bg-gradient-to-tr from-violet-600 to-pink-500'
                                }`}>
                                  {idx + 1}
                                </div>
                                <span className="text-xs font-bold text-pink-400 font-mono tracking-wide">{week.week}</span>
                              </div>
                              
                              <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-bold border ${
                                status === 'completed' ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/60' :
                                status === 'active' ? 'text-pink-400 bg-pink-950/20 border-pink-900/60' :
                                'text-violet-600 bg-transparent border-violet-950'
                              }`}>
                                {status === 'completed' ? 'Done' : status === 'active' ? 'Active' : 'Locked'}
                              </span>
                            </div>
                            
                            <h4 className="text-sm font-bold text-white mb-4 min-h-[32px]">{week.title}</h4>
                            
                            {/* Checkbox tasks list */}
                            <div className="space-y-3">
                              {week.tasks.map((task, taskIdx) => {
                                const taskKey = `${week.week}||${task}`;
                                const isChecked = (user?.completedRoadmapTasks || []).includes(taskKey);
                                
                                return (
                                  <button
                                    key={taskIdx}
                                    disabled={isLocked}
                                    onClick={() => handleToggleRoadmapTask(week.week, task)}
                                    className={`flex items-start space-x-2.5 w-full text-left transition-all ${
                                      isLocked ? 'pointer-events-none' : 'cursor-pointer'
                                    }`}
                                  >
                                    <div className={`mt-0.5 h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-all ${
                                      isChecked 
                                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                                        : 'border-violet-800 hover:border-violet-600 bg-black/40'
                                    }`}>
                                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                    </div>
                                    <span className={`text-xs leading-tight transition-all ${
                                      isChecked 
                                        ? 'text-violet-400/70 line-through' 
                                        : 'text-violet-200'
                                    }`}>
                                      {task}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-4 text-center py-12 border border-dashed border-violet-950 rounded-2xl">
                      <p className="text-xs text-violet-400">Configure target details during onboarding to generate roadmaps.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
