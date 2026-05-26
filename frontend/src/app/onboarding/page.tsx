'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store/useStore';
import { Cpu, ChevronRight, ChevronLeft, Loader2, Award, Zap, Code2, Globe } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { token, user, setUser } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Profile Form States
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [dsaConfidence, setDsaConfidence] = useState('Intermediate');
  const [skillsInput, setSkillsInput] = useState('React, Node.js, JavaScript, MongoDB');
  const [weakAreasInput, setWeakAreasInput] = useState('Operating Systems, Dynamic Programming');
  const [targetCompaniesInput, setTargetCompaniesInput] = useState('Amazon, TCS');
  const [githubUsername, setGithubUsername] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    
    // Parse CSV inputs
    const knownSkills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
    const weakAreas = weakAreasInput.split(',').map(s => s.trim()).filter(Boolean);
    const targetCompanies = targetCompaniesInput.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          onboardingCompleted: true,
          githubUsername: githubUsername.trim(),
          leetcodeUsername: leetcodeUsername.trim(),
          profile: {
            targetRole,
            dsaConfidence,
            knownSkills,
            weakAreas,
            targetCompanies
          }
        })
      });

      const updatedUser = await response.json();

      if (!response.ok) {
        throw new Error(updatedUser.message || 'Failed to update profile');
      }

      setUser(updatedUser);
      router.push('/dashboard');
    } catch (error) {
      alert('Error saving profile onboarding. Please ensure backend is running.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'AI/ML Engineer',
    'Cloud Engineer',
    'Data Engineer'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="grid-bg"></div>

      <div className="max-w-xl w-full glass-panel border border-violet-950 p-8 shadow-2xl relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-violet-950 rounded-t-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-violet-400" />
            <span className="text-[10px] text-violet-400 font-mono tracking-widest uppercase">
              Profile Assessment Step {step} of 3
            </span>
          </div>
          <span className="text-xs text-violet-300/60">Onboarding</span>
        </div>

        {/* Step 1: Career Direction */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Select your Target Career Path</h2>
              <p className="text-xs text-violet-300/70">
                Choose the role you are actively targeting. This determines interview parameters and roadmaps.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => {
                const isSelected = targetRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => setTargetRole(role)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-violet-950/60 border-violet-500 text-white shadow-lg shadow-violet-500/10'
                        : 'bg-violet-950/20 border-violet-950 text-violet-300 hover:border-violet-850 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 mb-2 uppercase font-mono">
                DSA Experience Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((level) => {
                  const isSelected = dsaConfidence === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setDsaConfidence(level)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        isSelected
                          ? 'bg-violet-900/40 border-violet-500 text-white'
                          : 'bg-violet-950/10 border-violet-950 text-violet-300 hover:border-violet-900'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={nextStep}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-xs flex items-center space-x-1 hover:brightness-110 shadow-lg shadow-violet-950/40 transition"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Skill Mapping */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Define your skill matrix</h2>
              <p className="text-xs text-violet-300/70">
                Supply your primary technology skills and target companies to tailormake revision items.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-violet-300 mb-1.5 uppercase font-mono">
                  Skills known (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Java, React, Node.js, SQL"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 mb-1.5 uppercase font-mono">
                  Weak topics or subjects (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="DBMS, Operating Systems, Dynamic Programming"
                  value={weakAreasInput}
                  onChange={(e) => setWeakAreasInput(e.target.value)}
                  className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 mb-1.5 uppercase font-mono">
                  Target Companies (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Amazon, Google, TCS, Infosys"
                  value={targetCompaniesInput}
                  onChange={(e) => setTargetCompaniesInput(e.target.value)}
                  className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-sm transition"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="px-4 py-2.5 rounded-xl bg-violet-950/50 hover:bg-violet-900/30 text-violet-300 border border-violet-900/50 text-xs font-semibold flex items-center space-x-1 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                onClick={nextStep}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-xs flex items-center space-x-1 hover:brightness-110 shadow-lg shadow-violet-950/40 transition"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Handles integration */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Connect Coding handles</h2>
              <p className="text-xs text-violet-300/70">
                Add your GitHub and Leetcode handles to aggregate metrics and track code commit streaks.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-violet-300 mb-1.5 uppercase font-mono">
                  GitHub Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. torvalds"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-violet-300 mb-1.5 uppercase font-mono">
                  LeetCode Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. dsa_champion"
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  className="w-full bg-[#0a051d] text-white px-4 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-sm transition"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={prevStep}
                className="px-4 py-2.5 rounded-xl bg-violet-950/50 hover:bg-violet-900/30 text-violet-300 border border-violet-900/50 text-xs font-semibold flex items-center space-x-1 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-xs flex items-center space-x-1.5 hover:brightness-110 shadow-lg shadow-violet-950/40 transition cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Finish Set up</span>
                    <Award className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
