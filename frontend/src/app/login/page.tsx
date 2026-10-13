'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store/useStore';
import { Cpu, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin 
      ? 'http://localhost:5000/api/auth/login' 
      : 'http://localhost:5000/api/auth/register';

    const body = isLogin 
      ? { email, password } 
      : { name, email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Save token and user details to store
      setToken(data.token);
      setUser(data.user);

      // Redirect based on onboarding completeness
      if (data.user.onboardingCompleted) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Network error, please check backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated Matrix-style Grid Background */}
      <div className="grid-bg"></div>

      {/* Decorative Blur Aura Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none pulse-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none pulse-glow" style={{ animationDelay: '1.5s' }}></div>

      {/* Premium Glassmorphic Card Container */}
      <div className="max-w-md w-full glass-panel border border-violet-950/40 p-8 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Header Title with animated gradient icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-tr from-violet-600 to-pink-500 p-3 rounded-2xl shadow-xl shadow-violet-500/20 mb-3 group hover:scale-105 transition-transform duration-300">
            <Cpu className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide bg-gradient-to-r from-violet-200 to-pink-200 bg-clip-text text-transparent">
            {isLogin ? 'Sign In to DevPrep' : 'Get Started with DevPrep'}
          </h2>
          <p className="text-[10px] text-violet-400/80 mt-1 uppercase font-mono tracking-widest">
            AI Placement OS
          </p>
        </div>

        {/* Sliding Tab Segment Control */}
        <div className="relative flex p-1 bg-[#0b0717]/80 rounded-xl border border-violet-950/40 mb-6 shrink-0">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-violet-600 to-pink-500 rounded-lg transition-transform duration-300 ease-out z-0 ${
              isLogin ? 'translate-x-0' : 'translate-x-full'
            }`}
          />
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`relative flex-1 py-2 text-xs font-bold text-center transition-colors duration-200 z-10 ${
              isLogin ? 'text-white' : 'text-violet-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`relative flex-1 py-2 text-xs font-bold text-center transition-colors duration-200 z-10 ${
              !isLogin ? 'text-white' : 'text-violet-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs flex items-center space-x-2.5 animate-fadeIn">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* Full Name Input (Appears only on Signup) */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isLogin ? 'max-h-0 opacity-0 scale-95 pointer-events-none mb-0' : 'max-h-24 opacity-100 scale-100 mb-4'
          }`}>
            <label className="block text-[10px] font-bold text-violet-300 mb-1.5 uppercase font-mono tracking-wider">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-violet-500 group-focus-within:text-violet-400 group-hover:text-violet-400 transition-colors" />
              </div>
              <input
                type="text"
                required={!isLogin}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0a051d] text-white pl-11 pr-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-xs transition"
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-[10px] font-bold text-violet-300 mb-1.5 uppercase font-mono tracking-wider">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-violet-500 group-focus-within:text-violet-400 group-hover:text-violet-400 transition-colors" />
              </div>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a051d] text-white pl-11 pr-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-xs transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-[10px] font-bold text-violet-300 mb-1.5 uppercase font-mono tracking-wider">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-violet-500 group-focus-within:text-violet-400 group-hover:text-violet-400 transition-colors" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a051d] text-white pl-11 pr-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-xs transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold text-xs hover:brightness-110 disabled:opacity-50 transition shadow-lg shadow-violet-950/40 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <span>{isLogin ? 'Sign In to Placement OS' : 'Launch Setup Onboarding'}</span>
            )}
          </button>
        </form>

        {/* Bottom Helper Info */}
        <div className="mt-6 text-center text-[10px] text-violet-400/60 leading-relaxed font-mono">
          Secured with local encrypted JWT state storage
        </div>
      </div>
    </div>
  );
}
