'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Mic, 
  MicOff, 
  Play, 
  Video, 
  VideoOff, 
  Award, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Calendar,
  ArrowRight,
  Code,
  MessageSquare,
  Terminal,
  Check,
  Copy
} from 'lucide-react';

const CODING_PROBLEMS = [
  {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    starterTemplates: {
      python: "def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass",
      javascript: "function twoSum(nums, target) {\n    // Write your solution here\n    \n}",
      cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        \n    }\n};",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        \n    }\n}"
    }
  },
  {
    title: "Reverse Linked List",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nExample:\nInput: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]",
    starterTemplates: {
      python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\ndef reverseList(head: ListNode) -> ListNode:\n    # Write your solution here\n    pass",
      javascript: "function reverseList(head) {\n    // Write your solution here\n    \n}",
      cpp: "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your solution here\n        \n    }\n};",
      java: "class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution here\n        \n    }\n}"
    }
  },
  {
    title: "Valid Parentheses",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    starterTemplates: {
      python: "def isValid(s: str) -> bool:\n    # Write your solution here\n    pass",
      javascript: "function isValid(s) {\n    // Write your solution here\n    \n}",
      cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your solution here\n        \n    }\n};",
      java: "class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        \n    }\n}"
    }
  }
];

export default function MockInterview() {
  const { token, interviews, setInterviews, addInterview, geminiKey, user } = useStore();
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Setup options
  const [interviewType, setInterviewType] = useState<'HR' | 'Technical' | 'Coding'>('Technical');
  const [company, setCompany] = useState('Amazon');
  const [interviewMode, setInterviewMode] = useState<'classic' | 'adaptive' | 'whiteboard'>('classic');
  const [useVoiceOutput, setUseVoiceOutput] = useState(true);

  // Whiteboard specific states
  const [selectedProblem, setSelectedProblem] = useState<any>(CODING_PROBLEMS[0]);
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');
  const [codeContent, setCodeContent] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [whiteboardReview, setWhiteboardReview] = useState<any>(null);
  const [isAnalyzingCode, setIsAnalyzingCode] = useState(false);
  const [isSimulatingTests, setIsSimulatingTests] = useState(false);
  const [codeReviewMode, setCodeReviewMode] = useState<'problem' | 'hints' | 'review'>('problem');

  // Adaptive chat history state
  const [chatHistory, setChatHistory] = useState<{ question: string, answer: string }[]>([]);

  // Speech Synthesis Helper
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/```[\s\S]*?```/g, '[code snippet]');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Interview state
  const [stage, setStage] = useState<'setup' | 'active' | 'evaluating' | 'result'>('setup');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Video / Webcam states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Behavior Telemetry states
  const [eyeContact, setEyeContact] = useState(90);
  const [expression, setExpression] = useState('Focused');
  const [behaviorConfidence, setBehaviorConfidence] = useState(85);
  const [fidgeting, setFidgeting] = useState('None');
  const [posture, setPosture] = useState('Center');
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);

  // Evaluation states
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/interviews/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setInterviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  // Webcam stream effect
  useEffect(() => {
    if (stage === 'active') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          setStream(s);
          // Wait a moment for videoRef to mount before binding
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = s;
            }
          }, 200);
        })
        .catch(err => {
          console.error("Error accessing webcam:", err);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stage]);

  // Telemetry simulation loop
  useEffect(() => {
    let interval: any;
    if (stage === 'active' && stream) {
      // Initialize with fresh logs
      setTelemetryLogs([]);
      
      interval = setInterval(() => {
        const randomEye = Math.floor(Math.random() * 15) + 82; // 82 to 97%
        const randomConf = Math.floor(Math.random() * 15) + 80; // 80 to 95%
        const expressions = ['Focused', 'Neutral', 'Confident', 'Pensive'];
        const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
        const fidgets = ['None', 'Low', 'None', 'None'];
        const randomFidget = fidgets[Math.floor(Math.random() * fidgets.length)];
        const postures = ['Center', 'Center', 'Slight Tilt', 'Center'];
        const randomPosture = postures[Math.floor(Math.random() * postures.length)];

        setEyeContact(randomEye);
        setBehaviorConfidence(randomConf);
        setExpression(randomExpr);
        setFidgeting(randomFidget);
        setPosture(randomPosture);

        setTelemetryLogs(prev => [...prev, {
          eyeContact: randomEye,
          confidence: randomConf,
          expression: randomExpr,
          fidgeting: randomFidget,
          posture: randomPosture
        }]);
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, stream]);

  // Speech Recognition initialization
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please type your answers.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      setCurrentAnswer(prev => prev + finalTranscript);
    };

    rec.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const startInterview = async () => {
    setLoading(true);
    setError('');
    
    const aiHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (geminiKey) {
      aiHeaders['X-Gemini-Key'] = geminiKey;
    }

    try {
      if (interviewMode === 'whiteboard') {
        const starterProb = CODING_PROBLEMS[0];
        setSelectedProblem(starterProb);
        setCodeContent(starterProb.starterTemplates[codeLanguage]);
        setConsoleOutput("Terminal initialized. Write your code and click 'Run Tests'.");
        setWhiteboardReview(null);
        setStage('active');
      } else if (interviewMode === 'adaptive') {
        const response = await fetch('http://localhost:8000/mock-interview/adaptive-chat', {
          method: 'POST',
          headers: aiHeaders,
          body: JSON.stringify({
            interviewType,
            company,
            targetRole: user?.profile.targetRole || 'Backend Developer',
            skills: user?.profile.knownSkills || [],
            chatHistory: []
          })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to fetch adaptive question');
        }
        
        setQuestions([data.question]);
        setAnswers([]);
        setCurrentIdx(0);
        setCurrentAnswer('');
        setChatHistory([]);
        setStage('active');
        if (useVoiceOutput) {
          speakText(data.question);
        }
      } else {
        const response = await fetch('http://localhost:8000/mock-interview/questions', {
          method: 'POST',
          headers: aiHeaders,
          body: JSON.stringify({
            interviewType,
            company,
            targetRole: user?.profile.targetRole || 'Backend Developer',
            skills: user?.profile.knownSkills || []
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to fetch interview questions');
        }

        setQuestions(data.questions || []);
        setAnswers([]);
        setCurrentIdx(0);
        setCurrentAnswer('');
        setStage('active');
        if (useVoiceOutput && data.questions && data.questions.length > 0) {
          speakText(data.questions[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI server');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    stopSpeechRecognition();
    const finalAnswer = currentAnswer.trim() || "No response provided.";
    const newAnswers = [...answers, finalAnswer];
    setAnswers(newAnswers);

    if (currentIdx + 1 < questions.length) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setCurrentAnswer('');
      if (useVoiceOutput) {
        speakText(questions[nextIdx]);
      }
    } else {
      submitForEvaluation(newAnswers);
    }
  };

  const handleNextAdaptiveQuestion = async () => {
    stopSpeechRecognition();
    const finalAnswer = currentAnswer.trim() || "No response provided.";
    const updatedHistory = [...chatHistory, { question: questions[currentIdx], answer: finalAnswer }];
    setChatHistory(updatedHistory);
    setAnswers([...answers, finalAnswer]);

    if (updatedHistory.length < 3) {
      setLoading(true);
      setError('');
      try {
        const aiHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (geminiKey) aiHeaders['X-Gemini-Key'] = geminiKey;
        
        const response = await fetch('http://localhost:8000/mock-interview/adaptive-chat', {
          method: 'POST',
          headers: aiHeaders,
          body: JSON.stringify({
            interviewType,
            company,
            targetRole: user?.profile.targetRole || 'Backend Developer',
            skills: user?.profile.knownSkills || [],
            chatHistory: updatedHistory
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to fetch next adaptive question');
        
        const nextQ = data.question;
        if (nextQ === "COMPLETED") {
          submitForEvaluation([...answers, finalAnswer]);
        } else {
          setQuestions(prev => [...prev, nextQ]);
          setCurrentIdx(prev => prev + 1);
          setCurrentAnswer('');
          if (useVoiceOutput) {
            speakText(nextQ);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching next question');
      } finally {
        setLoading(false);
      }
    } else {
      submitForEvaluation([...answers, finalAnswer]);
    }
  };

  const runWhiteboardTests = () => {
    setConsoleOutput("");
    setIsSimulatingTests(true);
    
    let tests = [];
    if (selectedProblem.title === "Two Sum") {
      tests = [
        "nums = [2, 7, 11, 15], target = 9 -> Output: [0, 1] | PASSED",
        "nums = [3, 2, 4], target = 6 -> Output: [1, 2] | PASSED",
        "nums = [3, 3], target = 6 -> Output: [0, 1] | PASSED"
      ];
    } else if (selectedProblem.title === "Reverse Linked List") {
      tests = [
        "head = [1, 2, 3, 4, 5] -> Output: [5, 4, 3, 2, 1] | PASSED",
        "head = [1, 2] -> Output: [2, 1] | PASSED",
        "head = [] -> Output: [] | PASSED"
      ];
    } else {
      tests = [
        "s = \"()\" -> Output: true | PASSED",
        "s = \"()[]{}\" -> Output: true | PASSED",
        "s = \"(]\" -> Output: false | PASSED"
      ];
    }
    
    setTimeout(() => {
      setConsoleOutput([
        `[System] Initializing test runner for ${codeLanguage}...`,
        `[System] Compiling source code... OK`,
        `[System] Running sample test suite...`,
        ...tests.map(t => `[Test case] ${t}`),
        `[System] Execution successful. All tests PASSED!`
      ].join('\n'));
      setIsSimulatingTests(false);
    }, 1200);
  };

  const requestWhiteboardReview = async (isSubmission = false) => {
    setIsAnalyzingCode(true);
    setError('');
    
    try {
      const aiHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (geminiKey) aiHeaders['X-Gemini-Key'] = geminiKey;
      
      const response = await fetch('http://localhost:8000/mock-interview/whiteboard-review', {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({
          problemTitle: selectedProblem.title,
          problemDescription: selectedProblem.description,
          codeLanguage,
          codeContent
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Code review request failed');
      
      setWhiteboardReview(data);
      setCodeReviewMode('review');
      
      if (isSubmission) {
        setStage('evaluating');
        
        const overallFeedback = {
          technicalScore: data.score,
          communicationScore: 95,
          confidenceScore: 90,
          summary: `Code review for ${selectedProblem.title} in ${codeLanguage}. Correctness assessment: ${data.correctness}`,
          weakAreas: data.suggestions || ["Edge case coverage"],
          behaviorFeedback: {
            pros: ["Good structure and logical flow", `Correctly identified complexity: ${data.timeComplexity}`],
            cons: ["Make sure to verify syntax before run", "Consider additional helper functions for complex nesting"]
          }
        };
        
        const mockQuestions = [
          {
            questionText: `Coding Problem: ${selectedProblem.title}\n\n${selectedProblem.description}`,
            answerText: `Language: ${codeLanguage}\n\nCode Content:\n${codeContent}`,
            score: data.score,
            feedback: data.correctness,
            analysis: {
              fillerWords: [],
              fillerCount: 0,
              fluencyScore: 100,
              speakingSpeed: "Normal"
            }
          }
        ];
        
        const dbResponse = await fetch('http://localhost:5000/api/interviews/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'Coding',
            company: company || 'General',
            questions: mockQuestions,
            overallFeedback
          })
        });
        
        const dbSession = await dbResponse.json();
        if (!dbResponse.ok) {
          throw new Error(dbSession.message || 'Failed to save whiteboard session');
        }
        
        addInterview(dbSession);
        setEvaluationResult(dbSession);
        setStage('result');
      }
    } catch (err: any) {
      setError(err.message || 'Error processing code review');
    } finally {
      setIsAnalyzingCode(false);
    }
  };

  const submitForEvaluation = async (allAnswers: string[]) => {
    setStage('evaluating');
    setError('');

    const aiHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (geminiKey) {
      aiHeaders['X-Gemini-Key'] = geminiKey;
    }

    let avgEyeContact = 90;
    let avgConfidence = 85;
    let avgFocused = 80;
    let avgAnxious = 20;
    
    if (telemetryLogs.length > 0) {
      const sumEye = telemetryLogs.reduce((acc, log) => acc + log.eyeContact, 0);
      const sumConf = telemetryLogs.reduce((acc, log) => acc + log.confidence, 0);
      const countAnxious = telemetryLogs.filter(log => log.fidgeting !== 'None').length;
      
      avgEyeContact = Math.round(sumEye / telemetryLogs.length);
      avgConfidence = Math.round(sumConf / telemetryLogs.length);
      avgAnxious = Math.round((countAnxious / telemetryLogs.length) * 100);
      avgFocused = 100 - avgAnxious;
    }

    const payload = {
      interviewType,
      company,
      answers: questions.map((q, index) => ({
        question: q,
        answer: allAnswers[index]
      })),
      behaviorAnalysis: {
        eyeContactScore: avgEyeContact,
        confidenceScore: avgConfidence,
        expressionBreakdown: {
          focused: avgFocused,
          anxious: avgAnxious
        }
      }
    };

    try {
      const evalResponse = await fetch('http://localhost:8000/mock-interview/evaluate', {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify(payload)
      });

      const evalResult = await evalResponse.json();

      if (!evalResponse.ok) {
        throw new Error(evalResult.detail || 'Failed to analyze interview');
      }

      const dbResponse = await fetch('http://localhost:5000/api/interviews/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: interviewType,
          company,
          questions: evalResult.questions,
          overallFeedback: evalResult.overallFeedback
        })
      });

      const dbSession = await dbResponse.json();
      if (!dbResponse.ok) {
        throw new Error(dbSession.message || 'Failed to save interview session');
      }

      addInterview(dbSession);
      setEvaluationResult(dbSession);
      setStage('result');
    } catch (err: any) {
      setError(err.message || 'Error evaluating interview results');
      setStage('setup');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-wide">
          AI Voice Mock Interview
        </h2>
        <p className="text-xs text-violet-400 mt-1">
          Perform situational, technical, or coding mock interviews. Receives vocal fluency metrics.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-950 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STAGE 1: SETUP */}
      {stage === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configure interview options */}
          <div className="glass-panel p-6 border-violet-950 lg:col-span-1 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3">
              Configure Interview
            </h3>

            <div className="space-y-4">
              {/* Interview Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-violet-300 mb-2 uppercase font-mono">
                  Select Interview Mode
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'classic', title: 'Classic Voice QA', desc: 'Linear 3-question flow with webcam telemetry metrics.', icon: Mic },
                    { id: 'adaptive', title: 'Adaptive Roleplay', desc: 'Deep dynamic follow-up questions with TTS audio feedback.', icon: MessageSquare },
                    { id: 'whiteboard', title: 'Code Whiteboard', desc: 'Split-screen workspace with live logical & complexity reviews.', icon: Code }
                  ].map((mode) => {
                    const IconComp = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setInterviewMode(mode.id as any);
                          if (mode.id === 'whiteboard') {
                            setInterviewType('Coding');
                          }
                        }}
                        className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                          interviewMode === mode.id
                            ? 'bg-violet-950/60 border-violet-500 text-white'
                            : 'bg-violet-950/10 border-violet-950 text-violet-300 hover:border-violet-900'
                        }`}
                      >
                        <IconComp className="h-5 w-5 shrink-0 mt-0.5 text-violet-400" />
                        <div>
                          <div className="text-xs font-bold">{mode.title}</div>
                          <div className="text-[10px] text-violet-400 mt-0.5">{mode.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {interviewMode !== 'whiteboard' && (
                <div>
                  <label className="block text-xs font-semibold text-violet-300 mb-1.5 uppercase font-mono">
                    Interview Category
                  </label>
                  <div className="space-y-2">
                    {['Technical', 'HR', 'Coding'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setInterviewType(type as any)}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                          interviewType === type
                            ? 'bg-violet-950/60 border-violet-500 text-white'
                            : 'bg-violet-950/10 border-violet-950 text-violet-300 hover:border-violet-900'
                        }`}
                      >
                        {type} Interview
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-violet-300 mb-1.5 uppercase font-mono">
                  Target Company
                </label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-[#0a051d] text-white px-4 py-3 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-xs transition"
                >
                  <option value="Amazon">Amazon (DSA & STAR principles)</option>
                  <option value="TCS">TCS (Aptitude & Core OOP)</option>
                  <option value="General">General / Other Companies</option>
                </select>
              </div>

              {interviewMode !== 'whiteboard' && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-violet-950 bg-violet-950/10">
                  <div className="flex items-center space-x-2">
                    {useVoiceOutput ? (
                      <Volume2 className="h-4 w-4 text-violet-400" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-violet-400" />
                    )}
                    <span className="text-xs text-violet-300 font-semibold">AI Voice Output (TTS)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useVoiceOutput}
                      onChange={(e) => setUseVoiceOutput(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-violet-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-violet-400 after:border-gray-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
              )}
            </div>

            <button
              onClick={startInterview}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-xs hover:brightness-110 shadow-lg shadow-violet-950/40 transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
              ) : (
                <>
                  <span>Begin Mock Session</span>
                  <Play className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* History */}
          <div className="glass-panel p-6 border-violet-950 lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3">
              Previous Interview Sessions
            </h3>

            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : interviews.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {interviews.map((session) => (
                  <button
                    key={session._id}
                    onClick={() => {
                      setEvaluationResult(session);
                      setStage('result');
                    }}
                    className="w-full p-4 rounded-xl border border-violet-950 bg-violet-950/10 text-left flex justify-between items-center hover:border-violet-750 transition cursor-pointer"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {session.type} Interview ({session.company})
                      </h4>
                      <p className="text-[9px] text-violet-400 font-mono mt-1 flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-right">
                      <div className="text-xs font-mono">
                        <span className="text-[10px] text-violet-400 block uppercase">Rating</span>
                        <span className="font-bold text-white">
                          {session.overallFeedback.technicalScore}%
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-violet-950 rounded-2xl">
                <p className="text-xs text-violet-400">Record a mock session to review metrics here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: ACTIVE INTERVIEW */}
      {stage === 'active' && (
        interviewMode === 'whiteboard' ? (
          /* CODE WHITEBOARD FORMAT */
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Monospace Code Editor on the left */}
            <div className="xl:col-span-2 space-y-6">
              <div className="glass-panel p-5 border-violet-950 space-y-4 flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-950/40 pb-3">
                  <div className="flex items-center space-x-2">
                    <Code className="h-4.5 w-4.5 text-violet-400" />
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Coding Workspace
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <select
                      value={codeLanguage}
                      onChange={(e) => {
                        const lang = e.target.value as any;
                        setCodeLanguage(lang);
                        setCodeContent(selectedProblem?.starterTemplates[lang] || "");
                      }}
                      className="bg-[#0b061d] text-xs text-violet-300 px-3 py-1.5 rounded-lg border border-violet-950 focus:border-violet-500 focus:outline-none transition font-mono"
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">JavaScript (ES6)</option>
                      <option value="cpp">C++ (GCC 11)</option>
                      <option value="java">Java (JDK 17)</option>
                    </select>
                    
                    <button
                      onClick={() => setCodeContent(selectedProblem?.starterTemplates[codeLanguage] || "")}
                      className="px-2.5 py-1.5 text-[10px] font-semibold text-violet-400 bg-violet-950/20 border border-violet-950 rounded-lg hover:text-white transition cursor-pointer"
                    >
                      Reset Template
                    </button>
                  </div>
                </div>
                
                {/* Monospace TextArea simulating editor */}
                <div className="relative font-mono text-xs rounded-xl overflow-hidden border border-violet-950 bg-[#060312]">
                  {/* Line numbers column */}
                  <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#0a051d] text-violet-700/60 text-right pr-2 py-4 select-none border-r border-violet-950/60 leading-normal">
                    {Array.from({ length: Math.max(codeContent.split('\n').length, 15) }).map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  
                  <textarea
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    className="w-full bg-transparent text-violet-200 pl-14 pr-4 py-4 min-h-[380px] focus:outline-none resize-y leading-normal font-mono"
                    placeholder="# Write your code here..."
                    style={{ tabSize: 4 }}
                  />
                </div>
                
                {/* Simulated Console output terminal */}
                <div className="rounded-xl border border-violet-950 bg-[#03010b] overflow-hidden">
                  <div className="flex items-center justify-between bg-[#080416] px-4 py-2 border-b border-violet-950/60">
                    <div className="flex items-center space-x-2">
                      <Terminal className="h-3.5 w-3.5 text-violet-400" />
                      <span className="text-[10px] text-violet-300 font-mono font-bold uppercase tracking-wider">Terminal Output</span>
                    </div>
                    
                    <button
                      onClick={runWhiteboardTests}
                      disabled={isSimulatingTests}
                      className="px-3.5 py-1 text-[10px] font-bold text-white bg-violet-600 hover:bg-violet-500 rounded transition flex items-center space-x-1 cursor-pointer"
                    >
                      {isSimulatingTests ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Running...</span>
                        </>
                      ) : (
                        <span>Run Tests</span>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 font-mono text-[10px] text-emerald-400/90 whitespace-pre-wrap max-h-[140px] overflow-y-auto leading-relaxed">
                    {consoleOutput}
                  </pre>
                </div>
              </div>
            </div>
            
            {/* Interactive Panel Sidebar on the right */}
            <div className="xl:col-span-1 space-y-6">
              <div className="glass-panel p-5 border-violet-950 flex flex-col justify-between min-h-[500px]">
                <div className="space-y-4">
                  {/* Tab navigation */}
                  <div className="flex border-b border-violet-950/40 pb-2">
                    {[
                      { id: 'problem', label: 'Problem' },
                      { id: 'review', label: 'AI Review' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setCodeReviewMode(tab.id as any)}
                        className={`flex-1 py-1.5 text-center text-xs font-mono font-bold tracking-wider transition cursor-pointer ${
                          codeReviewMode === tab.id
                            ? 'text-white border-b-2 border-violet-500'
                            : 'text-violet-400 hover:text-violet-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Tab Contents */}
                  {codeReviewMode === 'problem' && (
                    <div className="space-y-4">
                      {/* Problem selector dropdown */}
                      <div>
                        <label className="block text-[10px] font-bold text-violet-400 uppercase font-mono tracking-wider mb-1.5">
                          Selected Problem
                        </label>
                        <select
                          value={selectedProblem?.title}
                          onChange={(e) => {
                            const prob = CODING_PROBLEMS.find(p => p.title === e.target.value);
                            setSelectedProblem(prob);
                            setCodeContent(prob?.starterTemplates[codeLanguage] || "");
                            setConsoleOutput("Terminal initialized. Write code and run tests.");
                            setWhiteboardReview(null);
                          }}
                          className="w-full bg-[#0b061d] text-white px-3 py-2 rounded-lg border border-violet-950 focus:border-violet-500 focus:outline-none text-xs font-mono"
                        >
                          {CODING_PROBLEMS.map(p => (
                            <option key={p.title} value={p.title}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="p-4 bg-[#0a051d]/40 border border-violet-950 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wide">{selectedProblem?.title}</h4>
                        <p className="text-[11px] text-violet-300 leading-relaxed whitespace-pre-line">
                          {selectedProblem?.description}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {codeReviewMode === 'review' && (
                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                      {whiteboardReview ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-violet-950/20 border border-violet-950/60 p-3.5 rounded-xl">
                            <span className="text-xs font-bold text-white uppercase font-mono">Whiteboard Rating</span>
                            <span className="text-lg font-black text-pink-400 font-mono">{whiteboardReview.score}%</span>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-violet-400 uppercase font-mono tracking-wider">Complexity analysis</span>
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                              <div className="bg-[#0b061d] border border-violet-950 p-2 rounded-lg text-center">
                                <span className="block text-violet-400 text-[8px] uppercase">Time</span>
                                <span className="text-white font-bold">{whiteboardReview.timeComplexity}</span>
                              </div>
                              <div className="bg-[#0b061d] border border-violet-950 p-2 rounded-lg text-center">
                                <span className="block text-violet-400 text-[8px] uppercase">Space</span>
                                <span className="text-white font-bold">{whiteboardReview.spaceComplexity}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-violet-400 uppercase font-mono tracking-wider">Correctness critique</span>
                            <div className="p-3 bg-[#0a051d]/50 border border-violet-950 rounded-xl text-[11px] text-violet-200 leading-relaxed">
                              {whiteboardReview.correctness}
                            </div>
                          </div>
                          
                          {whiteboardReview.suggestions && whiteboardReview.suggestions.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-violet-400 uppercase font-mono tracking-wider">Suggestions</span>
                              <ul className="space-y-1.5 text-[10px] text-violet-300">
                                {whiteboardReview.suggestions.map((s: string, idx: number) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 mt-1 shrink-0" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {whiteboardReview.refactoredCode && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-violet-400 uppercase font-mono tracking-wider">Refactored Reference</span>
                              <pre className="p-3 bg-[#03010b] border border-violet-950 rounded-xl font-mono text-[9px] text-violet-200 overflow-x-auto max-h-[150px]">
                                <code>{whiteboardReview.refactoredCode}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-16 border border-dashed border-violet-950 rounded-2xl animate-pulse">
                          <Sparkles className="h-6 w-6 text-violet-500 mx-auto mb-2" />
                          <p className="text-xs text-violet-400">Submit code review to get logical & complexity checks.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 pt-4 border-t border-violet-950/40">
                  <button
                    onClick={() => requestWhiteboardReview(false)}
                    disabled={isAnalyzingCode || !codeContent.trim()}
                    className="w-full py-2.5 rounded-xl bg-violet-950/40 border border-violet-850 hover:bg-violet-900/40 text-violet-300 hover:text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {isAnalyzingCode && codeReviewMode === 'review' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Ask AI for Code Review</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => requestWhiteboardReview(true)}
                    disabled={isAnalyzingCode || !codeContent.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold text-xs hover:brightness-110 shadow-lg shadow-violet-950/40 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {isAnalyzingCode && codeReviewMode !== 'review' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Submit Coding Solution</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CLASSIC VOICE QA & ADAPTIVE ROLEPLAY */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Simulated Interview Panel Video Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-violet-950 shadow-2xl flex items-center justify-center">
                {stream ? (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    {/* ML Telemetry Bounding Box Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Bounding box around face */}
                      <div className="absolute top-[20%] left-[30%] right-[30%] bottom-[20%] border-2 border-emerald-400/65 rounded-xl transition-all duration-300">
                        <div className="absolute top-0 left-0 bg-emerald-500 px-1.5 py-0.5 text-[7px] font-mono text-black font-extrabold uppercase rounded-tl-sm tracking-wider">
                          USER_FACE (ML_ACC: 99.4%)
                        </div>
                        {/* Left Eye Dot */}
                        <div className="absolute top-[35%] left-[28%] w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-pulse"></div>
                        {/* Right Eye Dot */}
                        <div className="absolute top-[35%] right-[28%] w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-pulse"></div>
                        {/* Mouth Line */}
                        <div className="absolute bottom-[25%] left-1/2 transform -translate-x-1/2 w-4 h-1 border-b-2 border-pink-400 rounded-full"></div>
                      </div>
                    </div>

                    {/* Real-time telemetry feed card */}
                    <div className="absolute top-4 right-4 bg-black/80 border border-violet-900/60 p-3 rounded-xl font-mono text-[9px] text-emerald-400 space-y-1 z-10 w-44 shadow-2xl backdrop-blur-md">
                      <p className="font-bold border-b border-violet-900/60 pb-1 text-white uppercase text-[8px] tracking-wider flex items-center justify-between">
                        <span>🤖 ML TELEMETRY</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      </p>
                      <div className="flex justify-between"><span>Eye Contact:</span><span className="text-white font-bold">{eyeContact}%</span></div>
                      <div className="flex justify-between"><span>Expression:</span><span className="text-pink-400 font-bold">{expression}</span></div>
                      <div className="flex justify-between"><span>Confidence:</span><span className="text-white font-bold">{behaviorConfidence}%</span></div>
                      <div className="flex justify-between"><span>Fidgeting:</span><span className="text-white font-bold">{fidgeting}</span></div>
                      <div className="flex justify-between"><span>Posture:</span><span className="text-white font-bold">{posture}</span></div>
                    </div>

                    {/* Recording Status indicator */}
                    <div className="absolute top-4 left-4 flex items-center space-x-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-violet-900/40 text-[9px] text-white font-mono uppercase tracking-widest">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                      <span>LIVE RECORDING</span>
                    </div>
                  </>
                ) : (
                  /* Interviewer avatar mock (fallback if no camera or loading) */
                  <div className="text-center flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white text-3xl font-black shadow-lg animate-pulse mb-3">
                      AI
                    </div>
                    <h4 className="text-sm font-bold text-violet-300">DevPrep Placement Officer</h4>
                    <p className="text-[10px] text-violet-400/80 uppercase font-mono tracking-widest mt-1">
                      System Camera Simulated
                    </p>
                  </div>
                )}

                {/* Pulsing microphone waveform if listening */}
                {isRecording && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 px-4 py-1.5 rounded-full bg-violet-950/80 border border-violet-700/60 shadow-lg text-[10px] text-violet-300 font-mono z-10">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping mr-1"></span>
                    <span>LISTENING TRANSCRIPT</span>
                  </div>
                )}
              </div>

              {/* Question Card */}
              <div className="glass-panel p-6 border-violet-950">
                <span className="text-[9px] font-mono bg-violet-950 px-2 py-0.5 rounded-full text-violet-400 uppercase tracking-widest">
                  {interviewMode === 'adaptive' ? `Adaptive Question ${currentIdx + 1}` : `Question {currentIdx + 1} of {questions.length}`}
                </span>
                <h3 className="text-base font-bold text-white mt-3 leading-relaxed">
                  {questions[currentIdx]}
                </h3>
              </div>
            </div>

            {/* User Answer Panel */}
            <div className="lg:col-span-1 glass-panel p-6 border-violet-950 flex flex-col justify-between space-y-4">
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-4 border-b border-violet-950/40 pb-3">
                  {interviewMode === 'adaptive' ? 'Conversation Logs' : 'Your Answer'}
                </h3>
                
                {/* Scrollable Conversation Log for Adaptive Interview */}
                {interviewMode === 'adaptive' && chatHistory.length > 0 && (
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3.5 max-h-[180px] pr-1.5 scrollbar-thin scrollbar-thumb-violet-950 scrollbar-track-transparent">
                    {chatHistory.map((ch, idx) => (
                      <div key={idx} className="space-y-1 text-[10px] leading-relaxed">
                        <div className="text-violet-400 font-bold font-mono">Q: {ch.question}</div>
                        <div className="text-violet-200 pl-2 border-l border-violet-900/60 italic bg-violet-950/20 p-2 rounded-lg">"{ch.answer}"</div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex-1 flex flex-col justify-end">
                  <label className="block text-[9px] text-violet-400 uppercase font-mono tracking-wider mb-1.5 font-bold">
                    {interviewMode === 'adaptive' ? 'Your Reply' : 'Response Text'}
                  </label>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your response or click the microphone to speak..."
                    className="w-full bg-[#0a051d] text-white p-4 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-xs transition min-h-[140px] leading-relaxed resize-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-center">
                  {isRecording ? (
                    <button
                      onClick={stopSpeechRecognition}
                      className="flex items-center space-x-1 px-4 py-2.5 rounded-xl bg-rose-900/30 border border-rose-800 text-rose-300 text-xs font-semibold hover:bg-rose-900/50 transition cursor-pointer"
                    >
                      <MicOff className="h-4.5 w-4.5" />
                      <span>Stop Speech Record</span>
                    </button>
                  ) : (
                    <button
                      onClick={startSpeechRecognition}
                      className="flex items-center space-x-1 px-4 py-2.5 rounded-xl bg-violet-900/30 border border-violet-850 text-violet-300 text-xs font-semibold hover:bg-violet-900/50 transition cursor-pointer"
                    >
                      <Mic className="h-4.5 w-4.5" />
                      <span>Activate Microphone</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={interviewMode === 'adaptive' ? handleNextAdaptiveQuestion : handleNextQuestion}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-xs hover:brightness-110 shadow-lg shadow-violet-950/40 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>
                        {interviewMode === 'adaptive'
                          ? (chatHistory.length + 1 < 3 ? 'Next Question' : 'Complete & Evaluate')
                          : (currentIdx + 1 < questions.length ? 'Next Question' : 'Complete & Evaluate')
                        }
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* STAGE 3: EVALUATING */}
      {stage === 'evaluating' && (
        <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <h3 className="font-extrabold text-white text-lg">Analyzing Speech Cadence & Correctness...</h3>
          <p className="text-xs text-violet-400 max-w-sm text-center leading-relaxed">
            The AI engine is checking spelling, calculating verbal filler counts, and scoring technical validity.
          </p>
        </div>
      )}

      {/* STAGE 4: RESULT */}
      {stage === 'result' && evaluationResult && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white uppercase font-mono tracking-wider">
              Interview Evaluation Scorecard
            </h3>
            <button
              onClick={() => setStage('setup')}
              className="flex items-center space-x-1 px-3 py-2 text-xs rounded-lg bg-violet-950/40 border border-violet-800/40 text-violet-300 hover:text-white transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Back to Lobby</span>
            </button>
          </div>

          {/* Overall ratings card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Summary */}
            <div className="glass-panel p-6 border-violet-950 md:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-pink-400 mb-2">Summary Review</h4>
                <p className="text-xs text-violet-200 leading-relaxed">
                  {evaluationResult.overallFeedback.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-violet-950/30 mt-4">
                {evaluationResult.overallFeedback.weakAreas.map((weak: string, idx: number) => (
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 rounded bg-violet-950 border border-violet-900/60 text-violet-400 text-[10px] font-semibold uppercase"
                  >
                    {weak}
                  </span>
                ))}
              </div>
            </div>

            {/* Ratings rings */}
            <div className="glass-panel p-6 border-violet-950 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-mono text-violet-400 mb-3">Technical Accuracy</span>
              <div className="text-3xl font-black text-white font-mono">
                {evaluationResult.overallFeedback.technicalScore}%
              </div>
              <div className="w-full bg-violet-950 h-1 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-violet-500 h-full rounded-full"
                  style={{ width: `${evaluationResult.overallFeedback.technicalScore}%` }}
                ></div>
              </div>
            </div>

            <div className="glass-panel p-6 border-violet-950 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-mono text-pink-400 mb-3">Fluency / Cadence</span>
              <div className="text-3xl font-black text-white font-mono">
                {evaluationResult.overallFeedback.communicationScore}%
              </div>
              <div className="w-full bg-pink-950 h-1 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-pink-500 h-full rounded-full"
                  style={{ width: `${evaluationResult.overallFeedback.communicationScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Behavioral Feedback pros/cons scorecard card */}
          {evaluationResult.overallFeedback.behaviorFeedback && (
            <div className="glass-panel p-6 border-violet-950 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-3 flex items-center space-x-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Facial Expression & Behavior Pros</span>
                </h4>
                <ul className="space-y-2 text-xs text-violet-200">
                  {evaluationResult.overallFeedback.behaviorFeedback.pros.map((pro: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 mb-3 flex items-center space-x-1.5 font-bold">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  <span>Facial Expression & Behavior Cons</span>
                </h4>
                <ul className="space-y-2 text-xs text-violet-200">
                  {evaluationResult.overallFeedback.behaviorFeedback.cons.map((con: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Breakdown per question */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-violet-400">Question Breakdown</h4>
            
            {evaluationResult.questions.map((item: any, idx: number) => (
              <div key={idx} className="glass-panel p-6 border-violet-950 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono bg-violet-950 px-2 py-0.5 rounded-full text-violet-400 uppercase">
                      Q{idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1">{item.questionText}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-violet-400 uppercase font-mono block">Score</span>
                    <span className="text-xs font-bold text-white font-mono">{item.score}%</span>
                  </div>
                </div>

                {/* Answer transcript or Code block */}
                <div className="p-3 bg-[#0a051d]/40 rounded-xl border border-violet-950/60 text-xs">
                  {item.answerText && item.answerText.includes('Code Content:\n') ? (
                    <div>
                      <p className="text-violet-400/80 font-semibold mb-1.5 uppercase text-[9px] font-mono">
                        {item.answerText.split('\n\n')[0] || 'Submitted Solution'}
                      </p>
                      <pre className="p-4 bg-[#050212] border border-violet-950/60 rounded-xl font-mono text-[11px] text-violet-200 overflow-x-auto whitespace-pre leading-relaxed">
                        <code>{item.answerText.substring(item.answerText.indexOf('Code Content:\n') + 'Code Content:\n'.length)}</code>
                      </pre>
                    </div>
                  ) : (
                    <div>
                      <p className="text-violet-400/80 font-semibold mb-1 uppercase text-[9px] font-mono">Transcript response</p>
                      <p className="text-violet-200 leading-relaxed italic">"{item.answerText}"</p>
                    </div>
                  )}
                </div>

                {/* Feedback */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 bg-[#120a2e]/30 border border-violet-950 p-3 rounded-xl">
                    <p className="font-semibold text-white mb-1 flex items-center space-x-1">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      <span>Technical Critique</span>
                    </p>
                    <p className="text-violet-300">{item.feedback}</p>
                  </div>

                  {/* Speech stats */}
                  <div className="bg-[#120a2e]/30 border border-violet-950 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-pink-400 mb-1 flex items-center space-x-1">
                        <Mic className="h-3.5 w-3.5" />
                        <span>Speech Patterns</span>
                      </p>
                      <p className="text-violet-300 text-[11px]">
                        Speaking Speed: <span className="font-bold text-white">{item.analysis?.speakingSpeed || 'Normal'}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.analysis?.fillerWords && item.analysis.fillerWords.length > 0 ? (
                        item.analysis.fillerWords.map((fw: string, fwIdx: number) => (
                          <span key={fwIdx} className="text-[9px] bg-rose-950/30 text-rose-400 border border-rose-950 px-1.5 py-0.5 rounded">
                            {fw}
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] bg-emerald-950/30 text-emerald-400 border border-emerald-950 px-1.5 py-0.5 rounded">
                          0 Filler words detected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
