export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  args: unknown[];
  expected: unknown;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  statement?: string;
  constraints?: string[];
  examples?: ProblemExample[];
  starterCode?: Record<string, string>;
  sampleTestCases?: TestCase[];
}

export interface TopicVideo {
  videoId: string;
  title: string;
  creator: string;
  sourceUrl: string;
}

export interface TopicTheory {
  conceptDefinition: string;
  whyItMatters: string;
  explanation: string;
  syntaxAndExamples: Record<string, string>;
  walkthrough: string[];
  commonMistakes: string[];
  timeAndSpaceComplexity: string;
  whenToUse: string;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  summary: string;
  video?: TopicVideo;
  theory?: TopicTheory;
  problemsCount?: number;
  problems?: Problem[];
}

export interface Module {
  id: number;
  title: string;
  slug: string;
  description: string;
  topicsCount: number;
  problemsCount: number;
  topics: Topic[];
}

export interface Bookmark {
  _id: string;
  problemId: string;
  problemTitle: string;
  topicSlug: string;
  difficulty: Difficulty;
  createdAt: string;
}

export interface Submission {
  _id: string;
  problemId: string;
  problemTitle: string;
  topicSlug: string;
  difficulty: Difficulty;
  language: string;
  code: string;
  status: 'Accepted' | 'Failed' | 'Compilation Error' | 'Runtime Error';
  runtimeMs: number;
  passedTests: number;
  totalTests: number;
  testResults: Record<string, unknown>[];
  feedback: string;
  createdAt: string;
}

export interface RevisionProblem {
  problemId: string;
  problemTitle: string;
  topicSlug: string;
  difficulty: Difficulty;
  lastAttemptStatus: string;
  lastAttemptedAt: string;
}
