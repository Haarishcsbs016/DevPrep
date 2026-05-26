'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Loader2, 
  Bot, 
  User as UserIcon, 
  Plus, 
  MessageSquare,
  ChevronDown,
  ArrowRight,
  Code
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export default function AIChatPage() {
  const { user, geminiKey } = useStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('devprep_chat_sessions');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSessions(parsed);
          if (parsed.length > 0) {
            setActiveSessionId(parsed[0].id);
          } else {
            createNewSession();
          }
        } catch (e) {
          console.error("Error loading chat sessions:", e);
          createNewSession();
        }
      } else {
        createNewSession();
      }
    }
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('devprep_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessions, activeSessionId, loading]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'New Chat',
      messages: [
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hello! I'm your DevPrep AI assistant. Ask me anything about Data Structures, coding algorithms, resume updates, system design patterns, or placement preparation. I'm here to help!`,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    
    if (activeSessionId === id) {
      if (filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      } else {
        // If no sessions left, create a fresh one
        const freshSession: ChatSession = {
          id: Math.random().toString(36).substring(2, 9),
          title: 'New Chat',
          messages: [
            {
              id: 'welcome',
              sender: 'assistant',
              text: `Hello! I'm your DevPrep AI assistant. Ask me anything about Data Structures, coding algorithms, resume updates, system design patterns, or placement preparation. I'm here to help!`,
              timestamp: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString()
        };
        setSessions([freshSession]);
        setActiveSessionId(freshSession.id);
      }
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || !activeSessionId || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    // Update active session with user message
    let updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        const isFirstUserMessage = s.messages.filter(m => m.sender === 'user').length === 0;
        const newTitle = isFirstUserMessage ? (textToSend.length > 28 ? textToSend.substring(0, 25) + '...' : textToSend) : s.title;
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMsg]
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt = `You are DevPrep Chat, an expert ChatGPT-like software engineering tutor specializing in technical placement preparation.
      You help computer science students prepare for placements. You assist with coding challenges, algorithm design, system design principles, resume review, computer science theory (OS, DBMS, CN), and soft skills.
      Keep answers clear, well-structured, professional, and instructional. Use markdown formatting and wrap code blocks in standard triple backticks (e.g. \`\`\`javascript ... \`\`\`).`;

      const sessionToUse = updatedSessions.find(s => s.id === activeSessionId);
      const messagesToFormat = sessionToUse ? sessionToUse.messages : [];
      
      // Build history for Gemini
      const history = messagesToFormat.slice(1, -1).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        ...history,
        {
          role: 'user',
          parts: [{ text: textToSend }]
        }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ contents })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error communicating with Gemini');
      }

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I couldn't formulate a response.";

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toISOString()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, assistantMsg]
          };
        }
        return s;
      }));

    } catch (e: any) {
      console.warn("Gemini chat API error:", e);
      let errMsg = e.message || 'Please check your internet or API credentials.';
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('limit exceeded')) {
        errMsg = "⚠️ **Gemini Free Tier Quota Exceeded**. You have hit the rate limit for model requests. Please wait a moment (30–60 seconds) before sending another message, or try switching models.";
      }
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'assistant',
        text: errMsg,
        timestamp: new Date().toISOString()
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, errorMsg]
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatMessageText = (text: string) => {
    if (!text) return '';
    
    // Escape HTML to prevent XSS
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Format code blocks
    escaped = escaped.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="bg-black/60 p-4.5 rounded-xl border border-violet-900/30 font-mono text-sm my-3.5 overflow-x-auto text-violet-300 relative group"><div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-[9px] text-violet-400 uppercase font-mono tracking-wider">${lang || 'code'}</div><code class="block whitespace-pre">${code.trim()}</code></pre>`;
    });
    
    // Format inline code
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="bg-black/40 px-1.5 py-0.5 rounded font-mono text-pink-400 text-sm">$1</code>');
    
    // Format bold text
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    
    // Format bullet lists
    escaped = escaped.replace(/^\s*[-*]\s+(.+)$/gm, '<li class="ml-5 list-disc my-1.5 text-base text-violet-100">$1</li>');
    
    // Wrap paragraphs
    const paragraphs = escaped.split('\n\n');
    return paragraphs.map(p => {
      if (p.trim().startsWith('<li') || p.trim().startsWith('<pre')) {
        return p;
      }
      return `<p class="mb-4 leading-relaxed text-base text-violet-200/90">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');
  };

  const promptSuggestions = [
    { title: "Review standard recursion problems", desc: "Explain the base cases and call stacks for common interview topics." },
    { title: "Optimize project description for ATS", desc: "Rewrite weak bullet points to metrics-driven action achievements." },
    { title: "STAR method interview answers", desc: "Show me a framework to answer 'Tell me about a time you led a team'." },
    { title: "System Design of TinyURL", desc: "Explain core components: URL shortening hashing, redirect, and caching." }
  ];

  return (
    <div className="flex h-[84vh] rounded-2xl overflow-hidden glass-panel border-violet-950/40 relative">
      
      {/* ChatGPT Left Sidebar: Chat Sessions History */}
      <div className="w-64 border-r border-violet-950/40 bg-[#120a2e]/30 flex flex-col justify-between p-4 shrink-0 hidden md:flex">
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* New Chat Button */}
          <button
            onClick={createNewSession}
            className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl border border-violet-800/40 hover:border-violet-650 bg-violet-950/20 text-white text-xs font-semibold hover:bg-violet-950/40 transition-all duration-200 cursor-pointer shadow-lg shadow-violet-950/40"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>

          {/* List of chat titles */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1.5">
            {sessions.map(s => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition duration-150 group cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-violet-600/35 to-pink-600/15 text-white border-l-3 border-violet-500 font-semibold'
                      : 'text-violet-300/80 hover:text-white hover:bg-violet-950/20'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate font-normal">
                    <MessageSquare className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => deleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 hover:bg-rose-950/30 rounded transition shrink-0 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-violet-950/30 text-[9px] text-violet-400 leading-relaxed uppercase font-mono tracking-wider">
          🔒 History stored locally
        </div>
      </div>

      {/* ChatGPT Main Chat Interface */}
      <div className="flex-1 flex flex-col justify-between bg-[#07040e]/40 overflow-hidden relative">
        
        {/* Chat Area Header: Model Selector */}
        <div className="p-3 border-b border-violet-950/30 bg-[#0a051d]/40 flex justify-between items-center shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-violet-950/40 border border-violet-850 hover:border-violet-650 text-white text-xs font-semibold transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-pink-400" />
              <span>{selectedModel === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash (Default)' : 'Gemini 2.0 Flash (Ultra-fast)'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-violet-400" />
            </button>
            
            {showModelDropdown && (
              <div className="absolute top-10 left-0 w-64 bg-[#120a2e] border border-violet-800/60 rounded-xl shadow-2xl z-20 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedModel('gemini-2.5-flash');
                    setShowModelDropdown(false);
                  }}
                  className="w-full p-3 text-left text-xs text-white hover:bg-violet-950/60 transition flex flex-col"
                >
                  <span className="font-bold flex items-center space-x-1"><Sparkles className="h-3 w-3 text-pink-400" /><span>Gemini 2.5 Flash</span></span>
                  <span className="text-[10px] text-violet-400 mt-0.5">Fast, balanced model for standard coding and writing tasks.</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedModel('gemini-2.0-flash');
                    setShowModelDropdown(false);
                  }}
                  className="w-full p-3 text-left text-xs text-white hover:bg-violet-950/60 border-t border-violet-950/40 transition flex flex-col"
                >
                  <span className="font-bold flex items-center space-x-1"><Code className="h-3 w-3 text-violet-400" /><span>Gemini 2.0 Flash</span></span>
                  <span className="text-[10px] text-violet-400 mt-0.5">Ultra-fast response times for rapid question generation and review.</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-violet-300 font-semibold font-mono uppercase tracking-widest">Active</span>
          </div>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSession && activeSession.messages.length <= 1 && (
            /* ChatGPT Landing view if no messages sent */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-tr from-violet-600 to-pink-500 p-4 rounded-2xl shadow-xl shadow-violet-500/20 mb-4 animate-pulse">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-wide">
                  How can I help you prepare today?
                </h3>
                <p className="text-sm text-violet-400 mt-2 max-w-lg leading-relaxed">
                  Your dedicated AI assistant for programming logic, dynamic programming patterns, mock reviews, and engineering placement checklists.
                </p>
              </div>

              {/* Grid of suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.title)}
                    className="p-5 rounded-2xl border border-violet-950 bg-violet-950/10 text-left hover:border-violet-700/80 hover:bg-violet-950/20 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 group cursor-pointer shadow-lg shadow-black/10"
                  >
                    <h4 className="text-sm font-bold text-white flex justify-between items-center">
                      <span>{item.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-violet-500 group-hover:translate-x-1.5 transition" />
                    </h4>
                    <p className="text-xs text-violet-400 mt-1.5 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSession && activeSession.messages.length > 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {activeSession.messages.slice(1).map((msg) => {
                const isAssistant = msg.sender === 'assistant';
                return (
                  <div key={msg.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} w-full`}>
                    <div className={`flex items-start space-x-3 max-w-[85%] ${isAssistant ? '' : 'flex-row-reverse space-x-reverse'}`}>
                      {/* Avatar */}
                      <div className={`p-2 rounded-xl shrink-0 shadow-lg mt-1 ${
                        isAssistant 
                          ? 'bg-gradient-to-tr from-violet-600 to-pink-500 shadow-violet-900/20' 
                          : 'bg-violet-950/60 border border-violet-800 shadow-violet-950/50'
                      }`}>
                        {isAssistant ? (
                          <Bot className="h-5 w-5 text-white" />
                        ) : (
                          <UserIcon className="h-5 w-5 text-violet-300" />
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`p-5 rounded-2xl border text-base leading-relaxed shadow-md ${
                        isAssistant
                          ? 'bg-[#120a2e]/45 border-violet-950/70 text-violet-100 rounded-tl-none'
                          : 'bg-violet-600/80 border-violet-500/30 text-white rounded-tr-none'
                      }`}>
                        {isAssistant && (
                          <div className="flex items-center space-x-1.5 mb-2 text-pink-400 font-extrabold uppercase text-[10px] font-mono tracking-wider">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>AI Assistant Review</span>
                          </div>
                        )}
                        <div 
                          className="prose prose-invert max-w-none text-base"
                          dangerouslySetInnerHTML={{ __html: formatMessageText(msg.text) }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {loading && (
            <div className="flex justify-start w-full max-w-3xl mx-auto">
              <div className="flex items-start space-x-3 max-w-[85%]">
                <div className="bg-gradient-to-tr from-violet-600 to-pink-500 p-2 rounded-xl shrink-0 shadow-lg shadow-violet-900/20">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="p-4.5 bg-[#120a2e]/40 border border-violet-950/70 text-violet-400 text-sm flex items-center space-x-2 rounded-2xl rounded-tl-none">
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-violet-500" />
                  <span>DevPrep is computing a response...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input box bottom area */}
        <div className="p-6 border-t border-violet-950/30 bg-[#06030e]/40 shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="max-w-3xl mx-auto flex items-center space-x-3 bg-[#09051a] rounded-2xl border border-violet-950/80 p-2.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all shadow-2xl relative"
          >
            <input
              type="text"
              placeholder="Ask anything about coding questions, optimize resume descriptions, practice theory..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-transparent text-white px-4 py-3 text-sm focus:outline-none placeholder-violet-500/60"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-4 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:brightness-110 disabled:opacity-40 transition shadow-lg flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
          
          <p className="text-[10px] text-violet-500/80 text-center mt-3">
            💡 DevPrep Copilot may make mistakes. Double check critical code optimizations and design configurations.
          </p>
        </div>

      </div>
    </div>
  );
}
