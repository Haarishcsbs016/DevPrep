'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '../store/useStore';
import { 
  Cpu, 
  Mic, 
  Code2, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { token } = useStore();

  const handleStart = () => {
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const features = [
    {
      title: "RAG-Based AI Mentor",
      description: "Upload subject notes & PDFs to ask contextual study questions. Evaluates role readiness based on historical scores.",
      icon: Cpu,
      color: "from-violet-500 to-indigo-500",
      glow: "rgba(139, 92, 246, 0.4)"
    },
    {
      title: "AI Voice Mock Interviews",
      description: "Experience technical, coding, or HR interviews. Features real-time browser text-to-speech feedback & filler word tracking.",
      icon: Mic,
      color: "from-pink-500 to-rose-500",
      glow: "rgba(236, 72, 153, 0.4)"
    },
    {
      title: "DSA & Contest Tracking",
      description: "Monitor solved counts across 8 core topics, track strengths/weaknesses, and sync competitive profiles.",
      icon: Code2,
      color: "from-blue-500 to-cyan-500",
      glow: "rgba(59, 130, 246, 0.4)"
    },
    {
      title: "Resume ATS Intelligence",
      description: "Parse resumes to generate ATS optimization reports, detect missing keyword gaps, and get project description upgrades.",
      icon: FileText,
      color: "from-emerald-500 to-teal-500",
      glow: "rgba(16, 185, 129, 0.4)"
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden py-10">
      <div className="grid-bg"></div>

      {/* Top Header */}
      <header className="flex justify-between items-center w-full px-6 mb-12">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-violet-600 to-pink-500 p-2 rounded-xl">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              DevPrep AI
            </h1>
            <span className="text-[9px] text-violet-400 tracking-widest font-mono uppercase block -mt-1">
              Placement Operating System
            </span>
          </div>
        </div>
        
        <Link 
          href="/login" 
          className="px-5 py-2 text-sm font-semibold rounded-xl bg-violet-950/40 border border-violet-800/40 text-violet-200 hover:text-white hover:bg-violet-900/40 hover:border-violet-700/60 transition"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto my-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-violet-950/50 border border-violet-800/30 text-xs text-violet-300 font-medium mb-6 animate-pulse">
          <TrendingUp className="h-3.5 w-3.5 text-pink-500" />
          <span>Intelligent Placement Prep Built for Engineering Students</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
          Prepare Smarter. <br />
          <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Get Placement Ready.
          </span>
        </h2>

        <p className="text-base sm:text-lg text-violet-300/80 max-w-2xl mb-10 leading-relaxed">
          DevPrep AI consolidates DSA progress, resume parsing, voice mock interviews, notes RAG mentoring, and Github metrics into a unified, actionable placement readiness score.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-20">
          <button
            onClick={handleStart}
            className="group px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-base flex items-center justify-center space-x-2 shadow-xl shadow-violet-900/30 hover:brightness-110 transition duration-200 cursor-pointer"
          >
            <span>Get Started Now</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className="glass-card p-6 rounded-2xl relative group overflow-hidden border border-violet-950"
            >
              {/* Glow Accent */}
              <div 
                className="absolute -top-10 -right-10 w-24 h-24 rounded-full filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ backgroundColor: feat.glow }}
              ></div>

              <div className="flex items-center space-x-4 mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feat.color} text-white shadow-md`}>
                  <feat.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                  {feat.title}
                </h3>
              </div>
              <p className="text-sm text-violet-300/70 leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-violet-400/50 mt-16 border-t border-violet-950/20 pt-6">
        <p>© 2026 DevPrep AI OS. Built with Next.js, FastAPI & MongoDB.</p>
      </footer>
    </div>
  );
}
