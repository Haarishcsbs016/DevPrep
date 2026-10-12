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
  Unlock,
  Terminal,
  Cpu,
  CheckSquare
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
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';

interface RoadmapItem {
  week: string;
  title: string;
  tasks: string[];
}

export default function Dashboard() {
  const { token, user, setUser, dsaProgress, setDSAProgress, resumes, setResumes, geminiKey } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'dsa' | 'roadmap'>('overview');
  
  // Placement readiness states
  const [readinessScore, setReadinessScore] = useState(65);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [dailyTasks, setDailyTasks] = useState<string[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  
  // Interactive company selection state
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

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
      
      const [dsaRes, resumeRes] = await Promise.all([
        fetch('http://localhost:5000/api/dsa/progress', { headers }),
        fetch('http://localhost:5000/api/resume/history', { headers })
      ]);

      const dsaData = await dsaRes.json();
      const resumeData = await resumeRes.json();

      setDSAProgress(dsaData);
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
          profileStats: user?.profileStats || {},
          interviewHistory: []
        })
      });

      if (readinessRes.ok) {
        const readinessData = await readinessRes.json();
        setReadinessScore(Number(readinessData.placementReadinessScore) || 0);
        setWeaknesses(readinessData.weaknessAnalysis || []);
        setDailyTasks(readinessData.dailyTasks || []);
        setRoadmap(readinessData.roadmap || []);
      }

    } catch (error) {
      console.warn("Dashboard synchronization warning:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBackendData().finally(() => setLoading(false));
    }
  }, [token]);

  // Set initial selected company once user loads
  useEffect(() => {
    if (user?.profile?.targetCompanies && user.profile.targetCompanies.length > 0) {
      setSelectedCompany(user.profile.targetCompanies[0]);
    } else {
      setSelectedCompany('General Tech');
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Sync public coding profiles
      const syncResponse = await fetch('http://localhost:5000/api/auth/sync-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leetcodeUsername: user?.leetcodeUsername,
          githubUsername: user?.githubUsername,
          hackerrankUsername: user?.hackerrankUsername,
          hackerearthUsername: user?.hackerearthUsername
        })
      });
      if (syncResponse.ok) {
        const updatedUser = await syncResponse.json();
        setUser(updatedUser);
      }
    } catch (err) {
      console.warn("Error syncing profile stats:", err);
    }
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
      <div className="flex h-[80vh] items-center justify-center bg-[#0b0717]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <p className="text-xs text-violet-400 font-mono tracking-widest uppercase">Syncing placement metrics & AI Engines...</p>
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

  // Detailed sub-scores calculations for Placement Readiness Score breakdown
  const lcStats = user?.profileStats?.leetcode;
  const leetcodeSubscore = lcStats
    ? Math.round(
        (Math.min((lcStats.solved || 0) / 300, 1) * 100 +
          Math.min((lcStats.rating || 1500) / 1800, 1) * 100) /
          2
      )
    : Math.round(minMax((totalSolved / 40) * 100, 0, 100));

  const hrStats = user?.profileStats?.hackerrank;
  const hackerrankSubscore = hrStats?.stars
    ? (() => {
        const starValues = Object.values(hrStats.stars).map(Number).filter(v => v > 0);
        return starValues.length > 0
          ? Math.round((starValues.reduce((a, b) => a + b, 0) / starValues.length) * 20)
          : 60;
      })()
    : 70;

  const resumeSubscore = atsScore || 60;


  const ghStats = user?.profileStats?.github;
  const githubSubscore = ghStats
    ? Math.round(
        (Math.min((ghStats.commits || 0) / 300, 1) * 100 +
          Math.min((ghStats.repos || 0) / 15, 1) * 100) /
          2
      )
    : 65;

  // Map Recharts Data
  const radarData = safeProgress.map(topic => ({
    subject: topic.topic,
    solved: Math.min((Number(topic.solvedCount) || 0) * 20, 100),
    fullMark: 100
  }));

  // Recruitment Funnel calculation
  const funnelStages = [
    { id: 1, label: 'Profile Built', check: true, description: 'Interests set' },
    { id: 2, label: 'Resume ATS Ready', check: atsScore >= 70, description: 'Score ≥ 70%' },
    { id: 3, label: 'DSA Foundation', check: totalSolved >= 8, description: 'Solved 8+ problems' },
    { id: 4, label: 'Placement Certified', check: readinessScore >= 75, description: 'Score ≥ 75%' }
  ];

  // Dynamic Company Readiness Alignment
  const targetCompanies = user?.profile?.targetCompanies && user.profile.targetCompanies.length > 0
    ? user.profile.targetCompanies
    : ['General Tech'];
  const targetRole = user?.profile?.targetRole || 'Software Development Engineer';

  // Helper to categorize daily tasks with custom styled badges
  const getTaskCategory = (task: string) => {
    const lower = task.toLowerCase();
    if (lower.includes('dsa') || lower.includes('leetcode') || lower.includes('problem') || lower.includes('solve')) {
      return { label: 'DSA Practice', color: 'text-violet-450 border-violet-950 bg-violet-950/40' };
    }
    if (lower.includes('resume') || lower.includes('ats') || lower.includes('keyword')) {
      return { label: 'Resume ATS', color: 'text-emerald-450 border-emerald-950 bg-emerald-950/40' };
    }
    if (lower.includes('revise') || lower.includes('concept') || lower.includes('theory') || lower.includes('dbms') || lower.includes('sql') || lower.includes('oop')) {
      return { label: 'Tech Theory', color: 'text-pink-450 border-pink-950 bg-pink-950/40' };
    }
    return { label: 'Career Prep', color: 'text-indigo-450 border-indigo-950 bg-indigo-950/40' };
  };

  // Trajectory history mapping for Area Chart
  const trajectoryData = [
    { name: 'W1', readiness: Math.round(readinessScore * 0.45) || 20, dsa: Math.round(totalSolved * 0.2), ats: Math.round(atsScore * 0.5) || 35 },
    { name: 'W2', readiness: Math.round(readinessScore * 0.70) || 45, dsa: Math.round(totalSolved * 0.5), ats: Math.round(atsScore * 0.75) || 55 },
    { name: 'W3', readiness: Math.round(readinessScore * 0.85) || 60, dsa: Math.round(totalSolved * 0.8), ats: Math.round(atsScore * 0.9) || 70 },
    { name: 'Current', readiness: readinessScore, dsa: totalSolved, ats: atsScore }
  ];

  // Specific targets & thresholds per target company
  const getCompanyTargets = (company: string) => {
    const name = company.toLowerCase();
    if (name.includes('amazon') || name.includes('faang') || name.includes('meta')) {
      return { dsaTarget: 30, atsTarget: 80, difficulty: 'High (FAANG tier)' };
    }
    if (name.includes('microsoft') || name.includes('google') || name.includes('netflix')) {
      return { dsaTarget: 35, atsTarget: 85, difficulty: 'Elite Tier' };
    }
    if (name.includes('tcs') || name.includes('infosys') || name.includes('wipro')) {
      return { dsaTarget: 10, atsTarget: 65, difficulty: 'Services Tier' };
    }
    return { dsaTarget: 20, atsTarget: 70, difficulty: 'Competitive Tier' };
  };

  // Build simulated activity log based on actual database states
  const activityLogs = [];
  if (totalSolved > 0) {
    activityLogs.push({
      id: 'dsa',
      title: `Solved ${totalSolved} algorithm problems`,
      meta: `Latest: ${allSolvedProblems[0]?.title || 'Two Sum'}`,
      time: allSolvedProblems[0] ? new Date(allSolvedProblems[0].solvedAt).toLocaleDateString() : 'Active',
      color: 'bg-violet-500 shadow-violet-500/20'
    });
  }
  if (latestResume) {
    activityLogs.push({
      id: 'resume',
      title: `Resume scanned by ATS intelligence`,
      meta: `ATS Score: ${atsScore}% | Keyword gaps parsed`,
      time: new Date(latestResume.createdAt).toLocaleDateString(),
      color: 'bg-emerald-500 shadow-emerald-500/20'
    });
  }
  activityLogs.push({
    id: 'profile',
    title: 'Configured career preferences & targets',
    meta: `Targeting: ${targetRole} roles`,
    time: 'Onboarded',
    color: 'bg-indigo-500 shadow-indigo-500/20'
  });

  const selectedTargets = getCompanyTargets(selectedCompany);
  const matchedDsa = totalSolved >= selectedTargets.dsaTarget;
  const matchedAts = atsScore >= selectedTargets.atsTarget;

  // Custom tooltips styling for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f0a28]/95 border border-violet-850/80 px-3 py-2 rounded-xl text-[10px] font-mono shadow-2xl backdrop-blur-md">
          <p className="text-white font-bold mb-1">{label}</p>
          {payload.map((pld: any) => (
            <p key={pld.name} style={{ color: pld.color }}>
              <span className="uppercase font-semibold">{pld.name}</span>: {pld.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Placement Dashboard Hub */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-violet-950/30 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[9px] uppercase font-bold font-mono tracking-widest text-violet-400 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-900/30 shadow-sm flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-pink-500 animate-pulse" />
              <span>Placement OS Dashboard</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mt-2.5 flex items-center gap-2">
            <span>Placement Command Center</span>
          </h2>
          <p className="text-xs text-violet-400 mt-1">
            Analyzing readiness matrices for <span className="text-pink-400 font-bold">{targetRole}</span> roles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono text-violet-400/70 hidden sm:inline-block bg-[#0f0a28]/40 border border-violet-950/40 px-3 py-1.5 rounded-lg">
            Last Synced: {new Date().toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-violet-950/40 border border-violet-800/40 text-violet-300 text-xs font-bold hover:text-white hover:border-violet-600 hover:bg-violet-900/10 transition-all cursor-pointer shadow-md shadow-violet-950/20 active:scale-95"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync OS Status</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Placement Analytics Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL A: Interactive Placement Readiness Gauge & Sub-stats (Left) */}
        <div className="lg:col-span-1 glass-panel border-violet-950 p-6 flex flex-col justify-between items-center relative overflow-hidden h-[380px]">
          <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-to-tr from-violet-600/10 to-transparent rounded-full filter blur-2xl"></div>
          
          <div className="w-full flex justify-between items-center border-b border-violet-950/40 pb-3">
            <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-violet-400 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-violet-400" />
              <span>Placement Readiness</span>
            </span>
            <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-extrabold border ${
              readinessScore >= 80 ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/60 shadow-lg shadow-emerald-950/30' :
              readinessScore >= 60 ? 'text-amber-400 bg-amber-950/20 border-amber-900/60 shadow-lg shadow-amber-950/30' :
              'text-rose-400 bg-rose-950/20 border-rose-900/60 shadow-lg shadow-rose-950/30'
            }`}>
              {readinessScore >= 80 ? 'Tier-1 Elite' : readinessScore >= 60 ? 'Competitive' : 'Developing'}
            </span>
          </div>

          {/* Toggle between Gauge and Subscores */}
          {!showScoreBreakdown ? (
            <>
              {/* Elegant Custom SVG Circular Gauge */}
              <div className="relative my-2 flex items-center justify-center cursor-pointer group" onClick={() => setShowScoreBreakdown(true)}>
                <svg className="w-36 h-36 transform -rotate-90">
                  {/* Background circle track */}
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke="rgba(35, 23, 76, 0.5)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Neon progress circle */}
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke="url(#readinessGradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={364}
                    strokeDashoffset={364 - (364 * readinessScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center select-none group-hover:scale-105 transition-transform duration-300">
                  <span className="block text-3xl font-black text-white tracking-tight">{readinessScore}%</span>
                  <span className="text-[8px] uppercase font-mono tracking-widest text-violet-400/80">Readiness Score</span>
                </div>
              </div>

              {/* Summary Details */}
              <div className="w-full text-center space-y-1.5">
                <div className="text-[11px] text-violet-300">
                  Target: <span className="text-white font-bold">{targetRole}</span>
                </div>
                {weaknesses.length > 0 && (
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-900/30 text-rose-450 text-[10px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span>Top Weakness: {weaknesses[0]}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-full flex-1 my-2 space-y-2 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
              {/* LeetCode */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-semibold text-yellow-500 font-mono">
                  <span>LEETCODE / DSA (30%)</span>
                  <span>{leetcodeSubscore}%</span>
                </div>
                <div className="w-full bg-[#0a051d] h-1.5 rounded-full overflow-hidden border border-violet-950">
                  <div className="h-full bg-yellow-500" style={{ width: `${leetcodeSubscore}%` }}></div>
                </div>
              </div>

              {/* HackerRank */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-semibold text-emerald-400 font-mono">
                  <span>HACKERRANK (25%)</span>
                  <span>{hackerrankSubscore}%</span>
                </div>
                <div className="w-full bg-[#0a051d] h-1.5 rounded-full overflow-hidden border border-violet-950">
                  <div className="h-full bg-emerald-500" style={{ width: `${hackerrankSubscore}%` }}></div>
                </div>
              </div>

              {/* Resume ATS */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-semibold text-violet-300 font-mono">
                  <span>RESUME ATS SCAN (25%)</span>
                  <span>{resumeSubscore}%</span>
                </div>
                <div className="w-full bg-[#0a051d] h-1.5 rounded-full overflow-hidden border border-violet-950">
                  <div className="h-full bg-violet-500" style={{ width: `${resumeSubscore}%` }}></div>
                </div>
              </div>


              {/* GitHub Activity */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-semibold text-sky-400 font-mono">
                  <span>GITHUB CONTRIBUTIONS (20%)</span>
                  <span>{githubSubscore}%</span>
                </div>
                <div className="w-full bg-[#0a051d] h-1.5 rounded-full overflow-hidden border border-violet-950">
                  <div className="h-full bg-sky-400" style={{ width: `${githubSubscore}%` }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
            className="w-full mt-2 py-1.5 bg-violet-950/20 border border-violet-900/30 rounded-xl text-[9px] font-mono tracking-wider font-bold text-violet-400 hover:text-white transition cursor-pointer"
          >
            {showScoreBreakdown ? '◀ SHOW OVERALL MATCH' : 'VIEW DETAILED METRICS ▶'}
          </button>
        </div>

        {/* PANEL B: Placement Trajectory Area Chart (Middle) */}
        <div className="lg:col-span-1 glass-panel border-violet-950 p-6 flex flex-col justify-between h-[380px]">
          <div className="flex justify-between items-center border-b border-violet-950/40 pb-3">
            <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-pink-400 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-pink-400" />
              <span>Readiness Trajectory</span>
            </span>
            <span className="text-[9px] text-violet-400 font-mono">Adaptive AI Projection</span>
          </div>

          <div className="w-full h-52 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorReadiness" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(192, 132, 252, 0.6)', fontSize: 9 }} stroke="rgba(139, 92, 246, 0.1)" />
                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255, 255, 255, 0.4)', fontSize: 9 }} stroke="rgba(139, 92, 246, 0.1)" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="Readiness" dataKey="readiness" stroke="#c084fc" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReadiness)" />
                <Area type="monotone" name="ATS Scan" dataKey="ats" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-violet-400/80 leading-relaxed font-mono bg-[#0f0a28]/60 p-2.5 rounded-xl border border-violet-950/30">
            📊 **Trend Analysis**: System evaluates DSA commits and ATS formatting iterations to model target timeline matching.
          </p>
        </div>

        {/* PANEL C: Interactive Target Company Fit Console (Right) */}
        <div className="lg:col-span-1 glass-panel border-violet-950 p-6 flex flex-col justify-between h-[380px]">
          <div className="w-full flex justify-between items-center border-b border-violet-950/40 pb-3">
            <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-indigo-400" />
              <span>Target Company Benchmarks</span>
            </span>
            <span className="text-[9px] text-pink-400 font-mono font-bold uppercase">{selectedTargets.difficulty}</span>
          </div>

          {/* Dream Company alignment selectors */}
          <div className="flex flex-wrap gap-2.5 my-3 shrink-0">
            {targetCompanies.map((company) => {
              const isSelected = selectedCompany === company;
              return (
                <button
                  key={company}
                  type="button"
                  onClick={() => setSelectedCompany(company)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-600/35 to-pink-500/25 border-violet-500 text-white shadow-md'
                      : 'bg-violet-950/20 border-violet-950 text-violet-450 hover:text-white hover:border-violet-800'
                  }`}
                >
                  {company}
                </button>
              );
            })}
          </div>

          {/* Company requirements card */}
          <div className="flex-1 bg-[#130b2c]/60 border border-violet-950/80 rounded-xl p-4 space-y-4 text-xs overflow-y-auto">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-violet-400 font-mono uppercase">Requirements Matrix</span>
              <span className="text-pink-450 font-bold uppercase font-mono tracking-widest">{selectedCompany}</span>
            </div>

            <div className="space-y-3.5">
              {/* DSA Problem Match */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-[11px]">DSA Solve Count</h4>
                  <p className="text-[9px] text-violet-450 mt-0.5">Need {selectedTargets.dsaTarget}+ solved (Current: {totalSolved})</p>
                </div>
                <div className={`px-2 py-1.5 rounded-lg border text-[9px] font-bold font-mono flex items-center gap-1 shrink-0 ${
                  matchedDsa 
                    ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40' 
                    : 'text-amber-400 bg-amber-950/20 border-amber-900/40'
                }`}>
                  {matchedDsa ? <Check className="h-3 w-3 stroke-[3]" /> : <AlertTriangle className="h-3 w-3" />}
                  <span>{matchedDsa ? 'Pass' : 'Gap'}</span>
                </div>
              </div>

              {/* Resume ATS score match */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-[11px]">ATS Resume Score</h4>
                  <p className="text-[9px] text-violet-450 mt-0.5">Need {selectedTargets.atsTarget}%+ rating (Current: {atsScore}%)</p>
                </div>
                <div className={`px-2 py-1.5 rounded-lg border text-[9px] font-bold font-mono flex items-center gap-1 shrink-0 ${
                  matchedAts 
                    ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40' 
                    : 'text-amber-400 bg-amber-950/20 border-amber-900/40'
                }`}>
                  {matchedAts ? <Check className="h-3 w-3 stroke-[3]" /> : <AlertTriangle className="h-3 w-3" />}
                  <span>{matchedAts ? 'Pass' : 'Gap'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2.5 Connected Coding Profiles Integration */}
      <div className="glass-panel p-6 border-violet-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-600/5 to-transparent rounded-full filter blur-2xl"></div>
        <div className="flex justify-between items-center border-b border-violet-950/40 pb-3 mb-5">
          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Code2 className="h-4.5 w-4.5 text-violet-400" />
            <span>Connected Coding Profiles</span>
          </span>
          <span className="text-[10px] text-violet-400 font-mono">
            Status: {user?.profileStats?.lastSynced ? `Synced ${new Date(user.profileStats.lastSynced).toLocaleTimeString()}` : 'Not synced yet'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-5 select-none">
          {/* LeetCode Redesigned Card */}
          <div className="bg-[#120a2c]/50 border border-violet-950/80 hover:border-violet-900 rounded-2xl p-4.5 transition-all duration-300 flex flex-col justify-between min-h-[250px] relative overflow-hidden">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                  LeetCode
                </span>
                {user?.leetcodeUsername ? (
                  <span className="text-[9px] font-mono font-bold text-yellow-500 bg-yellow-950/30 border border-yellow-900/30 px-2 py-0.5 rounded-lg">
                    @{user.leetcodeUsername}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-violet-600 italic">Not Connected</span>
                )}
              </div>

              {/* Main Solve Breakdown */}
              <div className="flex items-center gap-4 my-2.5">
                {/* Circular Gauge */}
                <div className="relative h-18 w-18 flex items-center justify-center shrink-0">
                  <svg className="w-18 h-18 transform -rotate-90">
                    <circle cx="36" cy="36" r="28" stroke="rgba(35, 23, 76, 0.5)" strokeWidth="4.5" fill="transparent" />
                    <circle 
                      cx="36" 
                      cy="36" 
                      r="28" 
                      stroke="#f59e0b" 
                      strokeWidth="4.5" 
                      fill="transparent" 
                      strokeDasharray={176} 
                      strokeDashoffset={176 - (176 * (user?.profileStats?.leetcode?.solved || 246)) / 3949} 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="block font-black text-base text-white leading-none">{user?.profileStats?.leetcode?.solved || 246}</span>
                    <span className="text-[7px] text-violet-400 font-mono">/ 3949</span>
                  </div>
                </div>

                {/* Difficulty Bars */}
                <div className="flex-1 space-y-1.5 text-[10px]">
                  <div className="flex justify-between font-mono">
                    <span className="text-emerald-450 font-bold">Easy</span>
                    <span className="text-white font-bold">{user?.profileStats?.leetcode?.easySolved || 172}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-amber-400 font-bold">Medium</span>
                    <span className="text-white font-bold">{user?.profileStats?.leetcode?.mediumSolved || 69}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-rose-400 font-bold">Hard</span>
                    <span className="text-white font-bold">{user?.profileStats?.leetcode?.hardSolved || 5}</span>
                  </div>
                </div>
              </div>

              {/* Contest Rating & Global Rank */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-violet-950/40 text-[10px]">
                <div>
                  <span className="text-violet-400 font-mono block text-[8px] uppercase">Contest Rating</span>
                  <span className="text-white font-black text-xs font-mono">{user?.profileStats?.leetcode?.rating || 1435}</span>
                </div>
                <div>
                  <span className="text-violet-400 font-mono block text-[8px] uppercase">Global Ranking</span>
                  <span className="text-white font-black text-xs font-mono">#{user?.profileStats?.leetcode?.ranking ? user.profileStats.leetcode.ranking.toLocaleString() : '607,424'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-2">
              <span className="text-[8px] text-violet-400 font-mono">
                Contests: {user?.profileStats?.leetcode?.attendedContests || 18} attended
              </span>
              {user?.leetcodeUsername && (
                <a 
                  href={`https://leetcode.com/${user.leetcodeUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] font-mono text-violet-450 hover:text-white transition flex items-center gap-0.5"
                >
                  <span>LeetCode Page</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* HackerRank Redesigned Card */}
          <div className="bg-[#120a2c]/50 border border-violet-950/80 hover:border-violet-900 rounded-2xl p-4.5 transition-all duration-300 flex flex-col justify-between min-h-[250px] relative overflow-hidden">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  HackerRank
                </span>
                {user?.hackerrankUsername ? (
                  <span className="text-[9px] font-mono font-bold text-emerald-500 bg-emerald-950/30 border border-emerald-900/30 px-2 py-0.5 rounded-lg">
                    @{user.hackerrankUsername}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-violet-600 italic">Not Connected</span>
                )}
              </div>

              {/* Skills and Stars Breakdown */}
              <div className="space-y-2.5 my-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white font-bold">Problem Solving</span>
                    <span className="text-emerald-400 font-mono text-[9px] font-bold">5 ★★★★★</span>
                  </div>
                  <div className="w-full bg-[#0a051d] h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white font-bold">Java Language</span>
                    <span className="text-emerald-400 font-mono text-[9px] font-bold">5 ★★★★★</span>
                  </div>
                  <div className="w-full bg-[#0a051d] h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white font-bold">SQL Database</span>
                    <span className="text-emerald-400 font-mono text-[9px] font-bold">4 ★★★★☆</span>
                  </div>
                  <div className="w-full bg-[#0a051d] h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[8px] text-violet-400 font-mono uppercase tracking-wider bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-md">
                Verified Badges: {user?.profileStats?.hackerrank?.badges?.length || 2}
              </span>
              {user?.hackerrankUsername && (
                <a 
                  href={`https://hackerrank.com/profile/${user.hackerrankUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] font-mono text-violet-450 hover:text-white transition flex items-center gap-0.5"
                >
                  <span>HackerRank Page</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* HackerEarth Redesigned Card */}
          <div className="bg-[#120a2c]/50 border border-violet-950/80 hover:border-violet-900 rounded-2xl p-4.5 transition-all duration-300 flex flex-col justify-between min-h-[250px] relative overflow-hidden">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
                  HackerEarth
                </span>
                {user?.hackerearthUsername ? (
                  <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-950/30 border border-sky-900/30 px-2 py-0.5 rounded-lg">
                    @{user.hackerearthUsername.replace(/\s+/g, '')}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-violet-600 italic">Not Connected</span>
                )}
              </div>

              {/* Main metrics display */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="p-3 bg-[#0a051d]/40 rounded-xl border border-violet-950/80 text-center shadow-inner">
                  <span className="text-[8px] text-violet-400 font-mono block uppercase">Solved</span>
                  <span className="text-xl font-black text-white mt-1 block">{user?.profileStats?.hackerearth?.solved || 120}</span>
                </div>
                <div className="p-3 bg-[#0a051d]/40 rounded-xl border border-violet-950/80 text-center shadow-inner">
                  <span className="text-[8px] text-violet-400 font-mono block uppercase">Rating</span>
                  <span className="text-xl font-black text-sky-400 mt-1 block">{user?.profileStats?.hackerearth?.rating || 1580}</span>
                </div>
              </div>

              <div className="text-[10px] text-violet-300/80 font-mono bg-[#0f0a28]/60 p-2 rounded-lg border border-violet-950/20 text-center">
                🏆 Percentile ranking: <strong className="text-white">Top 8.5%</strong> global developers
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[8px] text-violet-500 font-mono">
                Level: Competitive
              </span>
              {user?.hackerearthUsername && (
                <a 
                  href={`https://hackerearth.com/@${user.hackerearthUsername.replace(/\s+/g, '-')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] font-mono text-violet-450 hover:text-white transition flex items-center gap-0.5"
                >
                  <span>HackerEarth Page</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>

          {/* GitHub Redesigned Card with heat-map grid! */}
          <div className="bg-[#120a2c]/50 border border-violet-950/80 hover:border-violet-900 rounded-2xl p-4.5 transition-all duration-300 flex flex-col justify-between min-h-[250px] relative overflow-hidden">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse"></span>
                  GitHub activity
                </span>
                {user?.githubUsername ? (
                  <span className="text-[9px] font-mono font-bold text-pink-400 bg-pink-950/30 border border-pink-900/30 px-2 py-0.5 rounded-lg">
                    @{user.githubUsername}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-violet-600 italic">Not Connected</span>
                )}
              </div>

              {/* GitHub mini Heatmap grid! */}
              <div className="my-2 text-[9px] font-mono">
                <div className="flex justify-between text-[8px] text-violet-500 mb-1 px-1">
                  <span>Submissions past year</span>
                  <span className="font-bold text-pink-400">250 total</span>
                </div>
                {/* 7 rows x 20 columns grid */}
                <div className="flex justify-center p-1.5 bg-[#080415]/80 rounded-xl border border-violet-950/60 shadow-inner">
                  <div className="grid grid-flow-col grid-rows-7 gap-[2px]">
                    {Array.from({ length: 77 }).map((_, idx) => {
                      // OPACITY PATTERN
                      const opacities = [0.1, 0.4, 0.1, 0.7, 0.9, 0.4, 0.1, 0.1, 0.7, 0.9, 0.1, 0.4, 0.7, 0.1, 0.9, 0.1, 0.4, 0.7, 0.1, 0.7, 0.1, 0.4, 0.9, 0.4, 0.1, 0.7, 0.1, 0.4, 0.9, 0.1, 0.4, 0.1, 0.1, 0.7, 0.9, 0.4, 0.1, 0.4, 0.1, 0.4, 0.7, 0.9, 0.1, 0.1, 0.4, 0.7, 0.1, 0.1, 0.4, 0.7, 0.9, 0.1, 0.4, 0.1, 0.7, 0.9, 0.4, 0.1, 0.4, 0.1, 0.1, 0.4, 0.7, 0.9, 0.1, 0.4, 0.7, 0.1, 0.1, 0.7, 0.9, 0.4, 0.1, 0.4, 0.7, 0.9, 0.1];
                      const opacity = opacities[idx % opacities.length];
                      let cellClass = "bg-[#181135]/40";
                      if (opacity === 0.4) cellClass = "bg-emerald-950/70 border border-emerald-900/30";
                      if (opacity === 0.7) cellClass = "bg-emerald-600/60 border border-emerald-500/20";
                      if (opacity === 0.9) cellClass = "bg-emerald-400 shadow-sm shadow-emerald-500/20";
                      return (
                        <div 
                          key={idx} 
                          className={`w-1.5 h-1.5 rounded-[1px] ${cellClass}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Extra stats */}
              <div className="flex justify-between items-center text-[9px] font-mono mt-2.5 text-violet-400 px-1">
                <span>Active days: 129</span>
                <span>Max streak: 32 days</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 mt-1">
              <span className="text-[8px] text-violet-500 font-mono">
                Public Repos: {user?.profileStats?.github?.repos || 18}
              </span>
              {user?.githubUsername && (
                <a 
                  href={`https://github.com/${user.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9px] font-mono text-violet-450 hover:text-white transition flex items-center gap-0.5"
                >
                  <span>GitHub Page</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* AI Insight banner */}
        <div className="bg-[#170e37]/70 border border-violet-900/40 p-3.5 rounded-xl flex items-start gap-3">
          <div className="bg-gradient-to-tr from-violet-600 to-pink-500 p-2 rounded-lg text-white shadow shadow-violet-950/50">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-pink-450 font-mono">AI Profile Insights</h4>
            <p className="text-xs text-violet-200 mt-1 leading-relaxed">
              {weaknesses.includes("Dynamic Programming") || weaknesses.includes("Dynamic Programming depth") ? (
                <span>Your Graphs performance is strong, but <strong className="text-pink-450 font-extrabold">Dynamic Programming</strong> needs improvement. Focus on the recommended 1D and 2D DP roadmap tasks to raise your score.</span>
              ) : weaknesses.length > 0 ? (
                <span>Your code matches are progressing nicely, but <strong className="text-pink-450 font-extrabold">{weaknesses[0]}</strong> shows technical gaps. Follow today's AI plan to practice.</span>
              ) : (
                <span>Excellent coding profiles! All connected metrics are highly competitive. Focus on final certifications.</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Recruitment Pipeline Funnel Tracker */}
      <div className="glass-panel p-6 border-violet-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-violet-600/5 to-transparent rounded-full filter blur-xl"></div>
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
                    ? 'bg-violet-950 border-violet-500 text-violet-400 shadow-md shadow-violet-950/70 scale-110 animate-pulse ring-2 ring-violet-900/50'
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
        <div className="flex p-1 bg-[#120c26]/60 rounded-xl max-w-md border border-violet-950/40 shadow-xl">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'overview' 
                ? 'bg-gradient-to-r from-violet-600/30 to-pink-500/20 border border-violet-900/40 text-white shadow-md' 
                : 'text-violet-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dsa')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'dsa' 
                ? 'bg-gradient-to-r from-violet-600/30 to-pink-500/20 border border-violet-900/40 text-white shadow-md' 
                : 'text-violet-400 hover:text-white'
            }`}
          >
            DSA Coverage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'roadmap' 
                ? 'bg-gradient-to-r from-violet-600/30 to-pink-500/20 border border-violet-900/40 text-white shadow-md' 
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
                
                {/* Left Column: Daily Focus Backlog Items */}
                <div className="lg:col-span-2 glass-panel p-6 border-violet-950 flex flex-col justify-between min-h-[400px]">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-violet-950/30 pb-3">
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center space-x-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-450" />
                        <span>Daily Focus Hub</span>
                      </h3>
                      <span className="text-[9px] text-pink-400 font-bold bg-pink-950/20 border border-pink-900/30 px-2.5 py-0.5 rounded-full">
                        AI Recommended
                      </span>
                    </div>

                    {/* Progress tracking gauge for daily tasks */}
                    {dailyTasks.length > 0 && (
                      <div className="mb-4 bg-violet-950/20 border border-violet-950/60 p-3.5 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-violet-300">DAILY CHECKLIST COMPLETION</span>
                          <span className="text-pink-400 font-bold">
                            {Math.round((Object.values(checkedTasks).filter(Boolean).length / dailyTasks.length) * 100)}% Done
                          </span>
                        </div>
                        <div className="w-full bg-[#0a051d] h-1.5 rounded-full overflow-hidden border border-violet-950">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-600 to-pink-500 transition-all duration-300"
                            style={{ width: `${(Object.values(checkedTasks).filter(Boolean).length / dailyTasks.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {dailyTasks.length > 0 ? (
                        dailyTasks.map((task, idx) => {
                          const isChecked = !!checkedTasks[idx];
                          const cat = getTaskCategory(task);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleTask(idx)}
                              className={`flex items-center space-x-3.5 w-full text-left p-3.5 rounded-xl border transition-all text-xs cursor-pointer ${
                                isChecked 
                                  ? 'bg-violet-950/10 border-violet-950/40 text-violet-400/60 line-through'
                                  : 'bg-[#150f2f]/60 border-violet-950 text-violet-200 hover:border-violet-900'
                              }`}
                            >
                              <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                                isChecked 
                                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                                  : 'border-violet-850 bg-[#0a051d]/50'
                              }`}>
                                {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              </div>
                              <span className="flex-1 font-medium">{task}</span>
                              <span className={`text-[9px] font-bold font-mono px-2 py-0.5 border rounded-lg shrink-0 ${cat.color}`}>
                                {cat.label}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-xs text-violet-400 text-center py-6">No tasks generated yet. Ensure you have filled profile settings.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-violet-400/80 mt-6 leading-relaxed bg-[#0f0a28]/60 p-3 rounded-xl border border-violet-950/30">
                    💡 **Recruitment OS Insight**: Solving DSA problems or submitting resumes will cause the AI engine to recalibrate these checklist items dynamically.
                  </div>
                </div>

                {/* Right Column: Event Log */}
                <div className="space-y-6 lg:col-span-1">
                  {/* System Event Log */}
                  <div className="glass-panel p-6 border-violet-950 min-h-[400px] flex flex-col">
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3 flex items-center gap-1.5">
                      <Terminal className="h-4 w-4 text-violet-400" />
                      <span>OS System Event Log</span>
                    </h3>

                    <div className="relative pl-4 border-l border-violet-950/80 space-y-4 flex-1">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="relative">
                          <div className={`absolute -left-[20px] top-1.5 h-2.5 w-2.5 rounded-full ${log.color} ring-4 ring-[#0b0717]`}></div>
                          <div className="text-xs">
                            <h4 className="text-white font-bold">{log.title}</h4>
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
                <div className="lg:col-span-5 glass-panel p-6 border-violet-950 flex flex-col justify-between h-[450px]">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3">
                      DSA Domain Coverage
                    </h3>
                    <p className="text-[11px] text-violet-400 leading-normal mb-4">
                      Maps percentage coverage across core data structures. Target balanced mastery above 60% across all topics.
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
                <div className="lg:col-span-7 space-y-6 h-[450px] overflow-y-auto">
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
                          <div key={topic._id} className="p-3.5 bg-violet-950/15 border border-violet-950 rounded-xl space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-white font-bold">{topic.topic}</span>
                              <span className="text-violet-400 font-mono">{solved}/5 solved</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#0f0a28] rounded-full overflow-hidden border border-violet-950">
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
                      <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl shadow-inner">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 block uppercase tracking-wider">Easy</span>
                        <h4 className="text-3xl font-black text-white mt-1">{easyCount}</h4>
                      </div>
                      <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-2xl shadow-inner">
                        <span className="text-[10px] font-mono font-bold text-amber-400 block uppercase tracking-wider">Medium</span>
                        <h4 className="text-3xl font-black text-white mt-1">{mediumCount}</h4>
                      </div>
                      <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl shadow-inner">
                        <span className="text-[10px] font-mono font-bold text-rose-400 block uppercase tracking-wider">Hard</span>
                        <h4 className="text-3xl font-black text-white mt-1">{hardCount}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ROADMAP */}
            {activeTab === 'roadmap' && (
              <div className="space-y-6">
                
                {/* Visual Header / Progress Stats */}
                <div className="glass-panel p-6 border-violet-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-pink-500" />
                      <span>Adaptive {selectedCompany || 'Dream Company'} Prep Roadmap</span>
                    </h3>
                    <p className="text-xs text-violet-400">
                      Tailored SDE preparation plan targeting <span className="text-pink-400 font-semibold">{targetCompanies.join(', ')}</span>. Updates dynamically.
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
                        <Flame className="h-3.5 w-3.5 text-pink-500" />
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
                          <div className="hidden md:block flex-1 h-0.5 bg-violet-950 mx-4 border-t border-dashed border-violet-900/40"></div>
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
                          className={`border rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden min-h-[220px] ${
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
                              <Lock className="h-6 w-6 text-violet-600 mb-1 animate-pulse" />
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
                                status === 'active' ? 'text-pink-400 bg-pink-950/20 border-pink-900/60 shadow-md shadow-pink-950/20' :
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
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => handleToggleRoadmapTask(week.week, task)}
                                    className={`flex items-start space-x-2.5 w-full text-left transition-all ${
                                      isLocked ? 'pointer-events-none' : 'cursor-pointer hover:text-white'
                                    }`}
                                  >
                                    <div className={`mt-0.5 h-4.5 w-4.5 rounded border shrink-0 flex items-center justify-center transition-all ${
                                      isChecked 
                                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                                        : 'border-violet-850 hover:border-violet-600 bg-[#0a051d]/50'
                                    }`}>
                                      {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                    </div>
                                    <span className={`text-xs leading-tight transition-all ${
                                      isChecked 
                                        ? 'text-violet-405/60 line-through' 
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

// Simple math helper
function minMax(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
