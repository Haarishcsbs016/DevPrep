'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '../store/useStore';
import Navbar from './Navbar';
import AIChatbotWidget from './AIChatbotWidget';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Redirect logic: if no token, push to login
      const publicPaths = ['/login', '/'];
      if (!token && !publicPaths.includes(pathname)) {
        router.push('/login');
      } else if (token && user && !user.onboardingCompleted && pathname !== '/onboarding') {
        router.push('/onboarding');
      } else if (token && user && user.onboardingCompleted && (pathname === '/login' || pathname === '/onboarding')) {
        router.push('/dashboard');
      }
    }
  }, [token, user, pathname, mounted, router]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0717]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  const isPublicPath = ['/login', '/'].includes(pathname) || !user;
  const isOnboarding = pathname === '/onboarding';

  return (
    <div className="flex min-h-screen text-[#e0dcf0]">
      {/* Sidebar Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        isPublicPath || isOnboarding ? 'pl-0' : 'md:pl-64'
      }`}>
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      {!isPublicPath && <AIChatbotWidget />}
    </div>
  );
}
