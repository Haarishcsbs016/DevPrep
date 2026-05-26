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
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid-bg"></div>

      <div className="max-w-md w-full glass-panel border border-violet-950 p-8 shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-violet-600 to-pink-500 p-3 rounded-2xl shadow-xl shadow-violet-500/20 mb-3">
            <Cpu className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">
            {isLogin ? 'Welcome back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-violet-400 mt-1 uppercase font-mono tracking-widest">
            DevPrep AI Placement OS
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs flex items-center space-x-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-violet-300 mb-1.5 uppercase font-mono">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-violet-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a051d] text-white pl-10 pr-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-sm transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-violet-300 mb-1.5 uppercase font-mono">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-violet-500" />
              </div>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a051d] text-white pl-10 pr-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-violet-300 mb-1.5 uppercase font-mono">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-violet-500" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a051d] text-white pl-10 pr-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-sm transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-sm hover:brightness-110 transition shadow-lg shadow-violet-950/40 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-violet-300/80 hover:text-white transition font-medium"
          >
            {isLogin 
              ? "Don't have an account? Sign Up" 
              : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
