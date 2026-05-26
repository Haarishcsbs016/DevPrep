'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '../store/useStore';
import { 
  LayoutDashboard, 
  Code2, 
  FileText, 
  Mic, 
  UserCircle2, 
  LogOut, 
  Key, 
  Cpu, 
  User, 
  X,
  Settings,
  MessageSquare
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, geminiKey, setGeminiKey, logout } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(geminiKey || '');

  // Hide Navbar on authentication and onboarding paths
  const hidePaths = ['/login', '/onboarding', '/'];
  if (hidePaths.includes(pathname) || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const saveApiKey = () => {
    setGeminiKey(keyInput.trim() || null);
    setShowSettings(false);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'DSA Tracker', path: '/dsa', icon: Code2 },
    { name: 'Resume ATS', path: '/resume', icon: FileText },
    { name: 'AI Interview', path: '/interview', icon: Mic },
    { name: 'RAG Mentor', path: '/mentor', icon: Cpu },
    { name: 'AI Chatbot', path: '/chat', icon: MessageSquare }
  ];

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
          {/* Gemini Key Status */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg bg-violet-950/30 border border-violet-900/40 text-violet-300/80 hover:text-white hover:border-violet-700/60 transition-all duration-200"
          >
            <span className="flex items-center space-x-1.5">
              <Key className="h-3.5 w-3.5 text-violet-400" />
              <span>Gemini AI Key</span>
            </span>
            <span className={`h-2 w-2 rounded-full ${geminiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          </button>

          <div className="flex items-center space-x-3 p-2">
            <div className="bg-violet-900/40 p-1.5 rounded-lg border border-violet-800/30">
              <UserCircle2 className="h-6 w-6 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-violet-400/80 truncate">{user.email}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#120a2e] border border-violet-800/60 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Settings className="h-5 w-5 text-violet-400" />
                <span>Mentor System Settings</span>
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-violet-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-violet-300 font-semibold mb-1.5 uppercase font-mono tracking-wider">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter API Key (AI-xxxx...)"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-sm transition"
                />
                <p className="text-[10px] text-violet-400/70 mt-2 leading-relaxed">
                  Provide your Gemini API key to enable live RAG notes tutoring, resume enhancements, and deep verbal critiques. If left empty, DevPrep AI utilizes an advanced simulated feedback engine.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-violet-950/50 hover:bg-violet-900/40 text-violet-300 border border-violet-900/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveApiKey}
                  className="px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-medium hover:brightness-110 transition shadow-lg shadow-violet-950/40"
                >
                  Save configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
