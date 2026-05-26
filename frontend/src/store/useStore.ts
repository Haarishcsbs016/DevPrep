import { create } from 'zustand';

interface UserProfile {
  targetRole: string;
  knownSkills: string[];
  weakAreas: string[];
  targetCompanies: string[];
  dsaConfidence: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  profile: UserProfile;
  githubUsername?: string;
  leetcodeUsername?: string;
  completedRoadmapTasks?: string[];
}

interface SolvedProblem {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  solvedAt: string;
  platform: string;
}

interface DSAProgress {
  _id: string;
  topic: string;
  solvedCount: number;
  solvedProblems: SolvedProblem[];
  streak: number;
  lastActive: string;
}

interface QuestionAnalysis {
  fillerWords: string[];
  fillerCount: number;
  fluencyScore: number;
  speakingSpeed: string;
}

interface InterviewQuestion {
  questionText: string;
  answerText: string;
  score: number;
  feedback: string;
  analysis: QuestionAnalysis;
}

interface InterviewOverallFeedback {
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  summary: string;
  weakAreas: string[];
}

interface InterviewSession {
  _id: string;
  type: 'HR' | 'Technical' | 'Coding';
  company: string;
  status: string;
  questions: InterviewQuestion[];
  overallFeedback: InterviewOverallFeedback;
  createdAt: string;
}

interface ResumeProjectEnhancement {
  before: string;
  after: string;
  impact: string;
}

interface ResumeAnalysis {
  _id: string;
  fileName: string;
  atsScore: number;
  missingKeywords: string[];
  projectEnhancements: ResumeProjectEnhancement[];
  feedback: string;
  createdAt: string;
}

interface AppState {
  token: string | null;
  user: User | null;
  dsaProgress: DSAProgress[];
  interviews: InterviewSession[];
  resumes: ResumeAnalysis[];
  geminiKey: string | null;
  
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setDSAProgress: (progress: DSAProgress[]) => void;
  setInterviews: (interviews: InterviewSession[]) => void;
  addInterview: (session: InterviewSession) => void;
  setResumes: (resumes: ResumeAnalysis[]) => void;
  addResume: (report: ResumeAnalysis) => void;
  setGeminiKey: (key: string | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => {
  // Safe localStorage helper for Next.js SSR
  const getLocal = (key: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  };

  const setLocal = (key: string, value: string | null) => {
    if (typeof window !== 'undefined') {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    }
  };

  return {
    token: getLocal('devprep_token'),
    user: getLocal('devprep_user') ? JSON.parse(getLocal('devprep_user')!) : null,
    dsaProgress: [],
    interviews: [],
    resumes: [],
    geminiKey: getLocal('devprep_gemini_key') || 'AIzaSyBYJixNvk2kCx0_Nz_ksP1P96OOegsk0ds',

    setToken: (token) => {
      setLocal('devprep_token', token);
      set({ token });
    },
    setUser: (user) => {
      setLocal('devprep_user', user ? JSON.stringify(user) : null);
      set({ user });
    },
    setDSAProgress: (dsaProgress) => set({ dsaProgress }),
    setInterviews: (interviews) => set({ interviews }),
    addInterview: (session) => set((state) => ({ interviews: [session, ...state.interviews] })),
    setResumes: (resumes) => set({ resumes }),
    addResume: (report) => set((state) => ({ resumes: [report, ...state.resumes] })),
    setGeminiKey: (geminiKey) => {
      setLocal('devprep_gemini_key', geminiKey);
      set({ geminiKey });
    },
    logout: () => {
      setLocal('devprep_token', null);
      setLocal('devprep_user', null);
      set({ token: null, user: null, dsaProgress: [], interviews: [], resumes: [] });
    }
  };
});
export type { User, UserProfile, DSAProgress, SolvedProblem, InterviewSession, InterviewQuestion, ResumeAnalysis, ResumeProjectEnhancement };
