'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Cpu, 
  Send, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Trash2, 
  Award, 
  BookOpen, 
  MessageSquare, 
  ChevronRight, 
  Info, 
  Check, 
  X, 
  RefreshCw 
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'mentor';
  text: string;
  sources?: string[];
  chunks?: { file_name: string; text: string; }[];
}

export default function RAGMentor() {
  const { user, token, geminiKey } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'mentor',
      text: "Hello! I am your DevPrep AI Placement Mentor. Upload study notes or PDF documents, select which ones you want to study with, and we can query them, start custom revision quizzes, or browse key concept cards!"
    }
  ]);
  const [input, setInput] = useState('');
  const [querying, setQuerying] = useState(false);

  // File states
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Workspace Navigation
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'concepts'>('chat');

  // Interactive Quiz states
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({}); // question index -> chosen option
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Key Concepts states
  const [concepts, setConcepts] = useState<any[]>([]);
  const [extractingConcepts, setExtractingConcepts] = useState(false);

  // Citation details drawer
  const [activeChunks, setActiveChunks] = useState<{ file_name: string; text: string; }[] | null>(null);

  // Fetch files on mount
  useEffect(() => {
    if (user?.id) {
      fetchFiles();
    }
  }, [user?.id]);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`http://localhost:8000/rag/files?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(data.files || []);
        setSelectedFiles(data.files || []); // select all by default
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        setError('Only PDF files are supported');
        setFile(null);
      } else {
        setError('');
        setFile(selected);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    setError('');
    setUploadMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    const headers: Record<string, string> = {};
    if (geminiKey) {
      headers['X-Gemini-Key'] = geminiKey;
    }

    try {
      const response = await fetch('http://localhost:8000/rag/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to upload document');
      }

      setUploadMessage(`Successfully parsed ${file.name}! Saved ${result.chunksSaved} study chunks.`);
      
      // Update local file list and auto-select new file
      setUploadedFiles(prev => {
        if (!prev.includes(file.name)) {
          return [...prev, file.name];
        }
        return prev;
      });
      setSelectedFiles(prev => {
        if (!prev.includes(file.name)) {
          return [...prev, file.name];
        }
        return prev;
      });
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Error uploading document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!user?.id) return;
    if (!confirm(`Are you sure you want to delete "${fileName}"? This will permanently remove its indexed study chunks.`)) return;

    try {
      const response = await fetch('http://localhost:8000/rag/file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fileName
        })
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(f => f !== fileName));
        setSelectedFiles(prev => prev.filter(f => f !== fileName));
        setUploadMessage(`Deleted ${fileName} from Notes Vault.`);
        // Reset quiz and concepts if related to deleted file
        setQuizQuestions([]);
        setConcepts([]);
      } else {
        const result = await response.json();
        setError(result.detail || 'Failed to delete file');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting document');
    }
  };

  const handleToggleFile = (fileName: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileName)) {
        return prev.filter(f => f !== fileName);
      } else {
        return [...prev, fileName];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedFiles([...uploadedFiles]);
  };

  const handleClearSelection = () => {
    setSelectedFiles([]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one document in the Notes Vault to query.');
      return;
    }

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setQuerying(true);
    setError('');

    const aiHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (geminiKey) {
      aiHeaders['X-Gemini-Key'] = geminiKey;
    }

    try {
      const response = await fetch('http://localhost:8000/rag/query', {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({
          userId: user.id,
          query: userText,
          activeFiles: selectedFiles
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to get answer');
      }

      setMessages(prev => [
        ...prev, 
        { 
          sender: 'mentor', 
          text: result.answer, 
          sources: result.sources || [],
          chunks: result.chunks || []
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev, 
        { 
          sender: 'mentor', 
          text: `Error parsing query: ${err.message}. Please verify the AI backend is active.` 
        }
      ]);
    } finally {
      setQuerying(false);
    }
  };

  // Generate Interactive Quiz
  const handleGenerateQuiz = async () => {
    if (selectedFiles.length === 0 || !user?.id) {
      setError('Please select at least one document from the Vault to generate a quiz.');
      return;
    }

    setGeneratingQuiz(true);
    setError('');
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setQuizAnswers({});
    setShowExplanation(false);
    setQuizSubmitted(false);
    setQuizScore(0);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (geminiKey) {
      headers['X-Gemini-Key'] = geminiKey;
    }

    try {
      const response = await fetch('http://localhost:8000/rag/quiz', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          activeFiles: selectedFiles
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Failed to generate quiz');
      }
      setQuizQuestions(result.quiz || []);
    } catch (err: any) {
      setError(err.message || 'Error generating quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSelectQuizOption = (option: string) => {
    if (showExplanation) return; // Answer locked
    setQuizAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: option
    }));
    setShowExplanation(true);

    const currentQ = quizQuestions[currentQuestionIndex];
    if (option === currentQ.correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizSubmitted(true);
    }
  };

  // Extract Key Concepts
  const handleExtractConcepts = async () => {
    if (selectedFiles.length === 0 || !user?.id) {
      setError('Please select at least one document from the Vault to extract concepts.');
      return;
    }

    setExtractingConcepts(true);
    setError('');
    setConcepts([]);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (geminiKey) {
      headers['X-Gemini-Key'] = geminiKey;
    }

    try {
      const response = await fetch('http://localhost:8000/rag/concepts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          activeFiles: selectedFiles
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Failed to extract concepts');
      }
      setConcepts(result.concepts || []);
    } catch (err: any) {
      setError(err.message || 'Error extracting concepts');
    } finally {
      setExtractingConcepts(false);
    }
  };

  const handleDiscussConcept = (conceptName: string) => {
    setActiveTab('chat');
    setInput(`Explain the concept of "${conceptName}" in detail, explaining how it relates to my placement preparation notes.`);
  };

  return (
    <div className="space-y-6 pb-6 h-[88vh] flex flex-col justify-between">
      {/* Title */}
      <div className="shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-wide">
            RAG-Based AI Placement Mentor
          </h2>
          <p className="text-sm text-violet-400 mt-1">
            Upload study notes or PDFs, scope context dynamically, and access interactive revision tools.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Notes Context, Right Workspaces */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Drawer: Notes Upload and Catalog */}
        <div className="lg:col-span-1 glass-panel p-5 border-violet-950 flex flex-col space-y-5 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-3 border-b border-violet-950/40 pb-2 flex items-center space-x-2">
              <Upload className="h-4 w-4 text-violet-400" />
              <span>Notes Vault</span>
            </h3>

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-rose-950/30 border border-rose-900 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {uploadMessage && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-900 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="leading-snug">{uploadMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-3">
              <div className="border border-dashed border-violet-900/60 bg-[#0a051d]/40 rounded-xl p-5 text-center hover:border-violet-700 transition relative">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <FileText className="mx-auto h-7 w-7 text-violet-500 mb-1" />
                <p className="text-xs text-violet-300 font-semibold truncate px-1">
                  {file ? file.name : "Select PDF Notes"}
                </p>
                <p className="text-[9px] text-violet-500/80 mt-1 uppercase font-mono">
                  Vector Chunker
                </p>
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-xs hover:brightness-110 disabled:opacity-40 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <span>Index Subject Notes</span>
                )}
              </button>
            </form>
          </div>

          {/* Catalog of indexed vaults */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Indexed Context Files
              </h4>
              {uploadedFiles.length > 0 && (
                <div className="flex space-x-2 text-[10px] font-mono text-violet-400 font-bold uppercase">
                  <button onClick={handleSelectAll} className="hover:text-violet-200">All</button>
                  <span>|</span>
                  <button onClick={handleClearSelection} className="hover:text-violet-200">None</button>
                </div>
              )}
            </div>
            
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {uploadedFiles.length > 0 ? (
                uploadedFiles.map((fname, index) => {
                  const isSelected = selectedFiles.includes(fname);
                  return (
                    <div 
                      key={index}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        isSelected 
                          ? 'bg-[#150a3b]/60 border-violet-800/80' 
                          : 'bg-[#0a051d]/40 border-violet-950/80 opacity-60'
                      }`}
                    >
                      <div 
                        onClick={() => handleToggleFile(fname)}
                        className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer select-none"
                      >
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by click on row
                          className="h-3.5 w-3.5 accent-pink-500 rounded border-violet-900 cursor-pointer"
                        />
                        <FileText className="h-4 w-4 text-violet-400 shrink-0" />
                        <span className="text-xs text-violet-200 truncate font-semibold" title={fname}>{fname}</span>
                      </div>

                      <button 
                        onClick={() => handleDeleteFile(fname)}
                        className="p-1 rounded text-violet-500 hover:text-rose-400 hover:bg-rose-950/20 transition shrink-0 ml-1.5 cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-violet-400/80 leading-relaxed border border-dashed border-violet-950/50 rounded-xl p-3 bg-violet-950/5">
                  No study guides parsed yet. Click upload to index notes and activate RAG.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Interactive Workspaces */}
        <div className="lg:col-span-3 glass-panel border-violet-950 flex flex-col justify-between overflow-hidden relative">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-violet-950/60 bg-[#080415]/75 shrink-0 px-4 pt-2 space-x-2">
            <button
              onClick={() => { setActiveTab('chat'); setError(''); }}
              className={`px-4 py-2.5 rounded-t-xl text-xs md:text-sm font-bold uppercase font-mono tracking-wider transition flex items-center space-x-1.5 border-b-2 cursor-pointer ${
                activeTab === 'chat'
                  ? 'text-white border-pink-500 bg-violet-950/30'
                  : 'text-violet-400 border-transparent hover:text-violet-200'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Tutor Chat</span>
            </button>
            <button
              onClick={() => { setActiveTab('quiz'); setError(''); }}
              className={`px-4 py-2.5 rounded-t-xl text-xs md:text-sm font-bold uppercase font-mono tracking-wider transition flex items-center space-x-1.5 border-b-2 cursor-pointer ${
                activeTab === 'quiz'
                  ? 'text-white border-pink-500 bg-violet-950/30'
                  : 'text-violet-400 border-transparent hover:text-violet-200'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Practice Quiz</span>
            </button>
            <button
              onClick={() => { setActiveTab('concepts'); setError(''); }}
              className={`px-4 py-2.5 rounded-t-xl text-xs md:text-sm font-bold uppercase font-mono tracking-wider transition flex items-center space-x-1.5 border-b-2 cursor-pointer ${
                activeTab === 'concepts'
                  ? 'text-white border-pink-500 bg-violet-950/30'
                  : 'text-violet-400 border-transparent hover:text-violet-200'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Concept Explorer</span>
            </button>
          </div>

          {/* Workspace Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            
            {/* TAB 1: Chat Mentor */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                  {messages.map((msg, index) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div 
                        key={index} 
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-2xl p-4 md:p-5 rounded-2xl border text-sm md:text-base leading-relaxed ${
                          isUser 
                            ? 'bg-violet-900/25 border-violet-800/80 text-white rounded-tr-none'
                            : 'bg-[#120a2e]/50 border-violet-950/90 text-violet-100 rounded-tl-none'
                        }`}>
                          {!isUser && (
                            <div className="flex items-center space-x-1.5 mb-2 text-pink-400 font-bold uppercase text-[10px] font-mono tracking-wide">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>AI Mentor Review</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          
                          {/* Footnotes and details button */}
                          {!isUser && msg.sources && msg.sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-violet-950/60 flex flex-col space-y-2">
                              <div className="text-[10px] text-violet-400 flex flex-wrap gap-1.5 items-center">
                                <span className="font-bold uppercase font-mono">Sources cited:</span>
                                {msg.sources.map((s, sidx) => (
                                  <span key={sidx} className="bg-violet-950/80 border border-violet-900/40 px-2 py-0.5 rounded text-violet-300 font-mono text-[9px]">
                                    {s}
                                  </span>
                                ))}
                              </div>
                              {msg.chunks && msg.chunks.length > 0 && (
                                <button 
                                  onClick={() => setActiveChunks(msg.chunks || null)}
                                  className="text-[10px] text-pink-400 font-bold uppercase font-mono hover:text-pink-300 flex items-center space-x-1 cursor-pointer w-fit"
                                >
                                  <Info className="h-3.5 w-3.5 shrink-0" />
                                  <span>View Retrieved Chunks</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {querying && (
                    <div className="flex justify-start">
                      <div className="max-w-2xl p-4 rounded-2xl border border-violet-950 bg-[#120a2e]/40 text-violet-400 text-sm flex items-center space-x-2.5">
                        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                        <span>Tutoring notes retrieval active...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input text box */}
                <form onSubmit={handleSend} className="pt-3 border-t border-violet-950/30 flex items-center space-x-3 shrink-0">
                  <input
                    type="text"
                    placeholder={
                      selectedFiles.length > 0 
                        ? `Ask anything based on the ${selectedFiles.length} selected notes...` 
                        : "Select notes in the Vault on the left to start tutoring"
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-[#0a051d] text-white px-4 py-3.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-sm md:text-base transition"
                    disabled={querying}
                  />
                  
                  <button
                    type="submit"
                    disabled={!input.trim() || querying || selectedFiles.length === 0}
                    className="p-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:brightness-110 disabled:opacity-40 transition shadow-lg shadow-violet-950/40 flex items-center justify-center cursor-pointer"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: Interactive Quiz */}
            {activeTab === 'quiz' && (
              <div className="h-full flex flex-col justify-center items-center">
                {quizQuestions.length === 0 ? (
                  <div className="max-w-md text-center p-6 space-y-5">
                    <div className="bg-violet-950/30 p-4 rounded-2xl border border-violet-900/60 inline-block">
                      <Award className="h-10 w-10 text-pink-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Interactive Recall Quizzer</h3>
                    <p className="text-sm text-violet-300 leading-relaxed">
                      Evaluate your placement readiness. We'll generate a custom 5-question multiple-choice quiz based purely on your selected notes.
                    </p>
                    
                    <div className="p-3 bg-[#0a051d]/40 rounded-xl border border-violet-950 text-left text-xs space-y-2">
                      <p className="text-violet-400 font-semibold font-mono">ACTIVE FILE COPE:</p>
                      {selectedFiles.length > 0 ? (
                        <ul className="list-disc pl-4 text-violet-200 space-y-1">
                          {selectedFiles.map((f, idx) => <li key={idx} className="truncate">{f}</li>)}
                        </ul>
                      ) : (
                        <p className="text-rose-400 font-medium">No files selected! Please select active files on the left first.</p>
                      )}
                    </div>

                    <button
                      onClick={handleGenerateQuiz}
                      disabled={generatingQuiz || selectedFiles.length === 0}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition flex items-center justify-center space-x-2 cursor-pointer w-full"
                    >
                      {generatingQuiz ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                          <span>Generating Quiz Questions...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4.5 w-4.5 text-white" />
                          <span>Generate 5-Question Quiz</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : !quizSubmitted ? (
                  <div className="w-full max-w-2xl space-y-6">
                    {/* Progress indicators */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs md:text-sm font-semibold text-violet-300">
                        <span>QUESTION {currentQuestionIndex + 1} OF {quizQuestions.length}</span>
                        <span>{Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)}% COMPLETE</span>
                      </div>
                      <div className="w-full h-2 bg-violet-950/60 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Question Card */}
                    <div className="glass-panel p-6 border-violet-900 space-y-5 bg-violet-950/10">
                      <h4 className="text-base md:text-lg font-bold text-white leading-relaxed">
                        {quizQuestions[currentQuestionIndex].question}
                      </h4>

                      {/* Options list */}
                      <div className="space-y-3">
                        {quizQuestions[currentQuestionIndex].options.map((opt: string, oidx: number) => {
                          const isSelected = quizAnswers[currentQuestionIndex] === opt;
                          const isCorrect = opt === quizQuestions[currentQuestionIndex].correctAnswer;
                          const hasSelectedSomething = quizAnswers[currentQuestionIndex] !== undefined;
                          
                          let cardStyle = "border-violet-950 hover:border-violet-700 bg-violet-950/10 text-violet-200 hover:bg-violet-950/20";
                          if (hasSelectedSomething) {
                            if (isCorrect) {
                              cardStyle = "bg-emerald-950/25 border-emerald-600 text-emerald-200";
                            } else if (isSelected) {
                              cardStyle = "bg-rose-950/25 border-rose-600 text-rose-200";
                            } else {
                              cardStyle = "border-violet-950 bg-violet-950/5 text-violet-400 opacity-55";
                            }
                          }

                          return (
                            <button
                              key={oidx}
                              onClick={() => handleSelectQuizOption(opt)}
                              disabled={hasSelectedSomething}
                              className={`w-full p-4 rounded-xl border text-left text-sm md:text-base font-medium flex items-center justify-between transition-all cursor-pointer ${cardStyle}`}
                            >
                              <span>{opt}</span>
                              {hasSelectedSomething && (
                                isCorrect ? (
                                  <Check className="h-5 w-5 text-emerald-400 shrink-0 ml-2" />
                                ) : isSelected ? (
                                  <X className="h-5 w-5 text-rose-400 shrink-0 ml-2" />
                                ) : null
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {showExplanation && (
                        <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-900/50 space-y-1.5 animate-fadeIn">
                          <p className="text-xs font-bold font-mono tracking-wider text-pink-400">EXPLANATION:</p>
                          <p className="text-xs md:text-sm text-violet-200 leading-relaxed">
                            {quizQuestions[currentQuestionIndex].explanation}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Next Question Control */}
                    {showExplanation && (
                      <button
                        onClick={handleNextQuizQuestion}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-sm hover:brightness-110 transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-violet-950/20"
                      >
                        <span>
                          {currentQuestionIndex < quizQuestions.length - 1 
                            ? "Next Question" 
                            : "See Results"
                          }
                        </span>
                        <ChevronRight className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  // Quiz Complete Scorecard
                  <div className="max-w-md text-center p-6 space-y-6">
                    <div className="relative inline-block">
                      <div className="bg-violet-950/40 p-6 rounded-full border border-violet-800/80 inline-block animate-pulse">
                        <Award className="h-16 w-16 text-pink-400" />
                      </div>
                      <span className="absolute bottom-0 right-0 bg-pink-600 text-white text-xs font-bold font-mono px-2.5 py-1 rounded-full border-2 border-[#06030e]">
                        {quizScore} / {quizQuestions.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white">Quiz Completed!</h3>
                      <p className="text-sm text-violet-300">
                        {quizScore === quizQuestions.length 
                          ? "Masterful recall! You answered all questions perfectly."
                          : quizScore >= 3 
                          ? "Good effort! You've got a strong grasp, but revision helps."
                          : "Needs improvement. Review the documents and try again!"}
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleGenerateQuiz}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-xs md:text-sm hover:brightness-110 transition cursor-pointer"
                      >
                        Retry Quiz
                      </button>
                      <button
                        onClick={() => { setQuizQuestions([]); }}
                        className="flex-1 py-3 rounded-xl bg-violet-950 border border-violet-900 text-violet-300 font-semibold text-xs md:text-sm hover:bg-violet-900/30 transition cursor-pointer"
                      >
                        Exit Study Desk
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Concept Explorer */}
            {activeTab === 'concepts' && (
              <div className="h-full flex flex-col justify-start">
                {concepts.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-5 max-w-md mx-auto">
                    <div className="bg-violet-950/30 p-4 rounded-2xl border border-violet-900/60 inline-block">
                      <BookOpen className="h-10 w-10 text-pink-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Active Concept Miner</h3>
                    <p className="text-sm text-violet-300 leading-relaxed">
                      Let the placement mentor parse your study guides to mine terms, definitions, and placement significance for rapid flashcard revisions.
                    </p>

                    <div className="p-3 bg-[#0a051d]/40 rounded-xl border border-violet-950 text-left text-xs space-y-2 w-full">
                      <p className="text-violet-400 font-semibold font-mono">SELECTED SOURCE POOL:</p>
                      {selectedFiles.length > 0 ? (
                        <ul className="list-disc pl-4 text-violet-200 space-y-1">
                          {selectedFiles.map((f, idx) => <li key={idx} className="truncate">{f}</li>)}
                        </ul>
                      ) : (
                        <p className="text-rose-400 font-medium">No files selected! Please select active files on the left first.</p>
                      )}
                    </div>

                    <button
                      onClick={handleExtractConcepts}
                      disabled={extractingConcepts || selectedFiles.length === 0}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition flex items-center justify-center space-x-2 cursor-pointer w-full"
                    >
                      {extractingConcepts ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                          <span>Mining concepts...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4.5 w-4.5 text-white" />
                          <span>Extract Concepts list</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-violet-950/40">
                      <p className="text-xs font-mono font-bold text-violet-400">
                        MINED CONCEPTS FROM SELECT MATERIAL ({concepts.length})
                      </p>
                      <button 
                        onClick={handleExtractConcepts} 
                        className="text-xs font-mono text-pink-400 hover:text-pink-300 flex items-center space-x-1 cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {concepts.map((item, idx) => (
                        <div 
                          key={idx}
                          className="glass-panel p-5 border-violet-900 bg-[#0e0724]/30 flex flex-col justify-between space-y-4 hover:border-violet-700 transition group"
                        >
                          <div className="space-y-2">
                            <h5 className="text-base font-extrabold text-pink-400 tracking-wide">
                              {item.concept}
                            </h5>
                            <p className="text-xs md:text-sm text-violet-100 leading-relaxed font-medium">
                              {item.definition}
                            </p>
                            {item.significance && (
                              <p className="text-[11px] md:text-xs text-violet-400 italic bg-violet-950/20 p-2 rounded border border-violet-950/40 leading-snug">
                                <span className="font-semibold uppercase not-italic font-mono text-[9px] block text-violet-500 mb-0.5">Placement Significance:</span>
                                {item.significance}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleDiscussConcept(item.concept)}
                            className="mt-2 text-xs text-pink-500 font-bold uppercase font-mono tracking-wide hover:text-pink-400 flex items-center space-x-1 cursor-pointer w-fit opacity-80 group-hover:opacity-100 transition-opacity"
                          >
                            <span>Discuss with AI Tutor</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Slide-out matching chunk viewer */}
          {activeChunks && (
            <div className="absolute inset-0 bg-[#06030ec5] backdrop-blur-md z-40 flex justify-end animate-fadeIn">
              <div className="w-full max-w-lg bg-[#0e0728] border-l border-violet-900 h-full flex flex-col p-6 shadow-2xl animate-slideLeft">
                <div className="flex justify-between items-center pb-4 border-b border-violet-900/60 mb-4 shrink-0">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center space-x-2">
                      <Info className="h-4.5 w-4.5 text-pink-500" />
                      <span>Retrieved Context Chunks</span>
                    </h4>
                    <p className="text-[10px] text-violet-400 mt-0.5">The exact context used to answer your question</p>
                  </div>
                  <button 
                    onClick={() => setActiveChunks(null)}
                    className="p-1 rounded-lg border border-violet-900 text-violet-400 hover:text-white hover:bg-violet-950/50 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {activeChunks.map((c, cidx) => (
                    <div key={cidx} className="p-4 rounded-xl border border-violet-950 bg-[#09051d]/60 space-y-2">
                      <div className="flex items-center space-x-1.5 text-[9px] font-bold font-mono uppercase text-pink-400">
                        <FileText className="h-3.5 w-3.5 text-violet-500" />
                        <span>Source: {c.file_name}</span>
                      </div>
                      <p className="text-xs md:text-sm text-violet-200 leading-relaxed font-mono whitespace-pre-wrap">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
