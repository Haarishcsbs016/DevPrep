'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '../store/useStore';
import { buildGeminiKeyPool } from '../lib/geminiKeys';
import { 
  LayoutDashboard, 
  Code2, 
  FileText, 
  UserCircle2, 
  LogOut, 
  Key, 
  Cpu, 
  User, 
  X,
  Settings,
  MessageSquare,
  Lock,
  Loader2
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, setUser, dsaProgress, geminiKey, setGeminiKey, logout } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(geminiKey || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'api'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Profile form states
  const [nameInput, setNameInput] = useState('');
  const [githubInput, setGithubInput] = useState('');
  const [leetcodeInput, setLeetcodeInput] = useState('');
  const [hackerrankInput, setHackerrankInput] = useState('');
  const [hackerearthInput, setHackerearthInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [companiesInput, setCompaniesInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [weakAreasInput, setWeakAreasInput] = useState('');
  const [dsaConfidenceInput, setDsaConfidenceInput] = useState('Beginner');

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync inputs on open
  useEffect(() => {
    if (showSettings && user) {
      setNameInput(user.name || '');
      setGithubInput(user.githubUsername || '');
      setLeetcodeInput(user.leetcodeUsername || '');
      setHackerrankInput(user.hackerrankUsername || '');
      setHackerearthInput(user.hackerearthUsername || '');
      setRoleInput(user.profile?.targetRole || '');
      setCompaniesInput(user.profile?.targetCompanies?.join(', ') || '');
      setSkillsInput(user.profile?.knownSkills?.join(', ') || '');
      setWeakAreasInput(user.profile?.weakAreas?.join(', ') || '');
      setDsaConfidenceInput(user.profile?.dsaConfidence || 'Beginner');
      setKeyInput(geminiKey || '');
      setSaveStatus(null);
      setIsEditingProfile(false);
    }
  }, [showSettings, user, geminiKey]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const saveApiKey = () => {
    setGeminiKey(keyInput.trim() || null);
    setSaveStatus({ type: 'success', message: 'Gemini key pool updated successfully!' });
    setTimeout(() => {
      setShowSettings(false);
    }, 800);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: nameInput.trim(),
          githubUsername: githubInput.trim(),
          leetcodeUsername: leetcodeInput.trim(),
          hackerrankUsername: hackerrankInput.trim(),
          hackerearthUsername: hackerearthInput.trim(),
          profile: {
            targetRole: roleInput.trim(),
            knownSkills: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
            weakAreas: weakAreasInput.split(',').map(s => s.trim()).filter(Boolean),
            targetCompanies: companiesInput.split(',').map(c => c.trim()).filter(Boolean),
            dsaConfidence: dsaConfidenceInput
          }
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        setSaveStatus({ type: 'success', message: 'Profile updated successfully!' });
        setIsEditingProfile(false);
      } else {
        setSaveStatus({ type: 'error', message: data.message || 'Failed to update profile.' });
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'DSA Learning Hub', path: '/dsa', icon: Code2 },
    { name: 'Resume ATS', path: '/resume', icon: FileText },
    { name: 'RAG Mentor', path: '/mentor', icon: Cpu },
    { name: 'AI Chatbot', path: '/chat', icon: MessageSquare }
  ];

  // DSA metrics calculation for LeetCode profile view
  const safeProgress = Array.isArray(dsaProgress) ? dsaProgress : [];
  const totalSolved = safeProgress.reduce((acc, t) => acc + (t.solvedCount || 0), 0);
  const allSolvedProblems = safeProgress.flatMap(p => p.solvedProblems || []);
  const easyCount = allSolvedProblems.filter(p => p.difficulty === 'Easy').length;
  const mediumCount = allSolvedProblems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = allSolvedProblems.filter(p => p.difficulty === 'Hard').length;

  // Hide Navbar on authentication and onboarding paths
  const hidePaths = ['/login', '/onboarding', '/'];
  if (hidePaths.includes(pathname) || !user) {
    return null;
  }

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen w-64 glass-panel border-r border-violet-950/40 z-30 p-6 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-10">
            <div className="bg-gradient-to-tr from-violet-600 to-pink-500 p-2 rounded-xl shadow-lg shadow-violet-500/20">
              <Cpu className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-violet-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">
                DevPrep AI
              </h1>
              <span className="text-[10px] text-violet-400/80 tracking-widest font-mono uppercase block -mt-1">
                Placement OS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/30 to-pink-600/20 text-white border-l-4 border-violet-500 shadow-md shadow-violet-900/10'
                      : 'text-violet-300/70 hover:text-white hover:bg-violet-950/20'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${
                    isActive ? 'text-violet-400' : 'text-violet-500 group-hover:scale-110'
                  }`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Actions */}
        <div className="space-y-4 pt-4 border-t border-violet-950/30">
          <div className="flex items-center space-x-3 p-2">
            <div className="bg-violet-900/40 p-1.5 rounded-lg border border-violet-800/30">
              <UserCircle2 className="h-6 w-6 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-violet-400/80 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-violet-900/20 text-violet-300 hover:bg-violet-800/30 border border-violet-900/30 transition-all"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Config</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-rose-950/20 text-rose-300 hover:bg-rose-900/30 border border-rose-950/30 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-[#0f0a28]/95 border border-violet-805/60 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-5 border-b border-violet-950/30 pb-4 shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Settings className="h-5 w-5 text-violet-400" />
                <span>System Settings & Preferences</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-violet-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-violet-950/40 mb-5 shrink-0">
              <button
                type="button"
                onClick={() => { setActiveTab('profile'); setSaveStatus(null); }}
                className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-violet-400 hover:text-white'
                }`}
              >
                User Profile
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('api'); setSaveStatus(null); }}
                className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'api'
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-violet-400 hover:text-white'
                }`}
              >
                AI Configuration
              </button>
            </div>

            {/* Notification Alert */}
            {saveStatus && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-semibold shrink-0 ${
                saveStatus.type === 'success' 
                  ? 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-400' 
                  : 'bg-rose-950/40 border border-rose-900/60 text-rose-400'
              }`}>
                {saveStatus.message}
              </div>
            )}

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs min-h-[400px]">
              {activeTab === 'profile' ? (
                !isEditingProfile ? (
                  /* LeetCode-Style Profile Dashboard View */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Avatar & Basic Info Card */}
                    <div className="md:col-span-1 bg-[#161030]/40 border border-violet-950/70 p-5 rounded-2xl flex flex-col items-center text-center">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white font-black text-3xl shadow-lg mb-4">
                        {user ? user.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      
                      <h4 className="font-extrabold text-sm text-white">{user?.name}</h4>
                      <p className="text-[10px] text-violet-400 font-mono mt-0.5">{user?.email}</p>
                      
                      <div className="w-full border-t border-violet-950/45 my-4"></div>
                      
                      {/* Social/Coding Profiles */}
                      <div className="w-full space-y-2.5 text-left text-[11px]">
                        <div className="flex items-center justify-between text-violet-300">
                          <span className="font-semibold text-[9px] uppercase font-mono tracking-wider">GitHub</span>
                          {user?.githubUsername ? (
                            <a 
                              href={`https://github.com/${user?.githubUsername}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-pink-400 hover:underline font-mono truncate max-w-[110px]"
                            >
                              @{user?.githubUsername}
                            </a>
                          ) : (
                            <span className="text-violet-600 italic">Not set</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-violet-300">
                          <span className="font-semibold text-[9px] uppercase font-mono tracking-wider">LeetCode</span>
                          {user?.leetcodeUsername ? (
                            <a 
                              href={`https://leetcode.com/${user?.leetcodeUsername}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-yellow-500 hover:underline font-mono truncate max-w-[110px]"
                            >
                              @{user?.leetcodeUsername}
                            </a>
                          ) : (
                            <span className="text-violet-600 italic">Not set</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-violet-300">
                          <span className="font-semibold text-[9px] uppercase font-mono tracking-wider">HackerRank</span>
                          {user?.hackerrankUsername ? (
                            <a 
                              href={`https://hackerrank.com/profile/${user?.hackerrankUsername}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline font-mono truncate max-w-[110px]"
                            >
                              @{user?.hackerrankUsername}
                            </a>
                          ) : (
                            <span className="text-violet-600 italic">Not set</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-violet-300">
                          <span className="font-semibold text-[9px] uppercase font-mono tracking-wider">HackerEarth</span>
                          {user?.hackerearthUsername ? (
                            <a 
                              href={`https://hackerearth.com/@${user?.hackerearthUsername}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-sky-400 hover:underline font-mono truncate max-w-[110px]"
                            >
                              @{user?.hackerearthUsername}
                            </a>
                          ) : (
                            <span className="text-violet-600 italic">Not set</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="mt-6 w-full py-2 bg-violet-900/30 hover:bg-violet-800/40 border border-violet-900/60 hover:border-violet-750 rounded-xl text-[11px] font-bold text-violet-300 hover:text-white transition cursor-pointer"
                      >
                        Edit Profile
                      </button>
                    </div>

                    {/* Right Column: DSA Stats & Placement Preferences */}
                    <div className="md:col-span-2 space-y-4">
                      {/* LeetCode DSA Stats Card */}
                      <div className="bg-[#161030]/40 border border-violet-950/70 p-5 rounded-2xl">
                        <h4 className="font-bold text-[10px] uppercase tracking-wider text-violet-400 mb-4 font-mono">
                          DSA Problem Metrics (LeetCode)
                        </h4>
                        
                        <div className="flex items-center gap-6">
                          {/* Circular Solved Count */}
                          <div className="relative h-20 w-20 flex items-center justify-center shrink-0 bg-violet-950/30 rounded-full border-4 border-violet-905/40">
                            <div className="text-center">
                              <span className="block font-black text-xl text-white">{totalSolved}</span>
                              <span className="text-[8px] text-violet-400 uppercase font-mono tracking-wider">Solved</span>
                            </div>
                          </div>
                          
                          {/* Difficulty Bars */}
                          <div className="flex-1 space-y-2">
                            {/* Easy */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[9px] font-semibold text-emerald-400 font-mono">
                                <span>EASY</span>
                                <span>{easyCount} Solved</span>
                              </div>
                              <div className="w-full bg-[#0a051d] h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${totalSolved > 0 ? (easyCount / totalSolved) * 100 : 0}%` }}></div>
                              </div>
                            </div>
                            
                            {/* Medium */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[9px] font-semibold text-amber-400 font-mono">
                                <span>MEDIUM</span>
                                <span>{mediumCount} Solved</span>
                              </div>
                              <div className="w-full bg-[#0a051d] h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${totalSolved > 0 ? (mediumCount / totalSolved) * 100 : 0}%` }}></div>
                              </div>
                            </div>
                            
                            {/* Hard */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[9px] font-semibold text-rose-400 font-mono">
                                <span>HARD</span>
                                <span>{hardCount} Solved</span>
                              </div>
                              <div className="w-full bg-[#0a051d] h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500" style={{ width: `${totalSolved > 0 ? (hardCount / totalSolved) * 100 : 0}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Placement Preferences & Career Profile */}
                      <div className="bg-[#161030]/40 border border-violet-950/70 p-5 rounded-2xl space-y-3.5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] text-violet-400 font-mono uppercase block">Target Role</span>
                            <span className="text-white font-bold text-xs mt-0.5 block">{user?.profile?.targetRole || 'Not Specified'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-violet-400 font-mono uppercase block">DSA Confidence</span>
                            <span className="text-pink-400 font-bold text-xs mt-0.5 block uppercase font-mono">{user?.profile?.dsaConfidence || 'Beginner'}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-violet-400 font-mono uppercase block mb-1">Target Companies</span>
                          <div className="flex flex-wrap gap-1">
                            {user?.profile?.targetCompanies && user?.profile?.targetCompanies?.length > 0 ? (
                              user?.profile?.targetCompanies?.map(c => (
                                <span key={c} className="bg-violet-900/30 border border-violet-850 px-2 py-0.5 rounded text-[9px] text-violet-200">{c}</span>
                              ))
                            ) : (
                              <span className="text-violet-600 italic text-[9px]">None specified</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-violet-400 font-mono uppercase block mb-1">Known Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {user?.profile?.knownSkills && user?.profile?.knownSkills?.length > 0 ? (
                              user?.profile?.knownSkills?.map(s => (
                                <span key={s} className="bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded text-[9px] text-emerald-300">{s}</span>
                              ))
                            ) : (
                              <span className="text-violet-600 italic text-[9px]">None specified</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-violet-400 font-mono uppercase block mb-1">Weak Areas</span>
                          <div className="flex flex-wrap gap-1">
                            {user?.profile?.weakAreas && user?.profile?.weakAreas?.length > 0 ? (
                              user?.profile?.weakAreas?.map(w => (
                                <span key={w} className="bg-rose-950/20 border border-rose-900/40 px-2 py-0.5 rounded text-[9px] text-rose-300">{w}</span>
                              ))
                            ) : (
                              <span className="text-violet-600 italic text-[9px]">None specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Profile Form View */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="w-full bg-[#0a051d] text-white px-3.5 py-2 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          Email Address (Read-only)
                        </label>
                        <div className="w-full bg-[#0a051d]/40 text-violet-400/70 px-3.5 py-2 rounded-xl border border-violet-950/60 flex items-center justify-between cursor-not-allowed select-none">
                          <span>{user?.email}</span>
                          <Lock className="h-3.5 w-3.5 opacity-60" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          GitHub Username
                        </label>
                        <input
                          type="text"
                          placeholder="haarishcsbs016"
                          value={githubInput}
                          onChange={(e) => setGithubInput(e.target.value)}
                          className="w-full bg-[#0a051d] text-white px-3.5 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          LeetCode Username
                        </label>
                        <input
                          type="text"
                          placeholder="haarishcsbs016"
                          value={leetcodeInput}
                          onChange={(e) => setLeetcodeInput(e.target.value)}
                          className="w-full bg-[#0a051d] text-white px-3.5 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          HackerRank Username
                        </label>
                        <input
                          type="text"
                          placeholder="haarishcsbs016"
                          value={hackerrankInput}
                          onChange={(e) => setHackerrankInput(e.target.value)}
                          className="w-full bg-[#0a051d] text-white px-3.5 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          HackerEarth Username
                        </label>
                        <input
                          type="text"
                          placeholder="Haarish Guru"
                          value={hackerearthInput}
                          onChange={(e) => setHackerearthInput(e.target.value)}
                          className="w-full bg-[#0a051d] text-white px-3.5 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          Target Role
                        </label>
                        <input
                          type="text"
                          placeholder="Full Stack Developer"
                          value={roleInput}
                          onChange={(e) => setRoleInput(e.target.value)}
                          className="w-full bg-[#0a051d] text-white px-3.5 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          DSA Confidence Level
                        </label>
                        <select
                          value={dsaConfidenceInput}
                          onChange={(e) => setDsaConfidenceInput(e.target.value)}
                          className="w-full bg-[#0a051d] text-white px-3 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          Target Companies (Comma separated)
                        </label>
                        <input
                          type="text"
                          placeholder="Amazon, TCS, Microsoft"
                          value={companiesInput}
                          onChange={(e) => setCompaniesInput(e.target.value)}
                          className="w-full bg-[#0a051d] text-white px-3.5 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          Known Skills (Comma separated)
                        </label>
                        <input
                          type="text"
                          placeholder="React, Node.js, JavaScript, MongoDB"
                          value={skillsInput}
                          onChange={(e) => setSkillsInput(e.target.value)}
                          className="w-full bg-[#0a051d] text-white px-3.5 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-violet-300 font-semibold mb-1 uppercase font-mono tracking-wider text-[10px]">
                          Weak Areas (Comma separated)
                        </label>
                        <input
                          type="text"
                          placeholder="Operating Systems, Dynamic Programming"
                          value={weakAreasInput}
                          onChange={(e) => setWeakAreasInput(e.target.value)}
                          className="w-full bg-[#0a051d] text-white px-3.5 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-4 py-2">
                  <div>
                    <label className="block text-violet-300 font-semibold mb-1.5 uppercase font-mono tracking-wider text-[10px]">
                      Google Gemini API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Enter API Key (AI-xxxx...)"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none transition text-xs"
                    />
                    <p className="text-[10px] text-violet-400/70 mt-2 leading-relaxed">
                      Provide one or more Gemini API keys separated by commas or new lines. DevPrep AI will automatically fall through to the next key when one runs out of quota.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-violet-350 mt-2">
                    <span>Connection Status:</span>
                    <span className={`h-2 w-2 rounded-full ${buildGeminiKeyPool(geminiKey).length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    <span className="font-semibold">
                      {buildGeminiKeyPool(geminiKey).length > 0
                        ? `Active (${buildGeminiKeyPool(geminiKey).length} key${buildGeminiKeyPool(geminiKey).length === 1 ? '' : 's'} configured)`
                        : 'Offline (Simulated feedback)'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-violet-950/30 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs rounded-xl bg-violet-950/50 hover:bg-violet-900/40 text-violet-300 border border-violet-900/50 transition-all cursor-pointer"
              >
                Close
              </button>
              {activeTab === 'profile' && !isEditingProfile ? null : (
                <button
                  type="button"
                  onClick={activeTab === 'profile' ? handleSaveProfile : saveApiKey}
                  disabled={isSaving}
                  className="px-5 py-2 text-xs rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-medium hover:brightness-110 disabled:opacity-50 transition shadow-lg shadow-violet-950/40 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{activeTab === 'profile' ? 'Save Profile' : 'Save Key'}</span>
                </button>
              )}
              {activeTab === 'profile' && isEditingProfile && (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-[#2b1f54] hover:bg-[#3d2e74] text-violet-200 border border-violet-900/60 transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
