'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  MessageSquare, 
  Send, 
  X, 
  Sparkles, 
  Trash2, 
  Loader2, 
  Bot, 
  User as UserIcon, 
  ArrowRight,
  Maximize2
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function AIChatbotWidget() {
  const { user, geminiKey } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize with a welcome message once user is available
  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hi ${user.name}! I am your DevPrep AI Assistant. \n\nI can help you review DSA patterns, write clean code, refine your resume bullet points, or practice mock interview questions. What would you like to build or learn today?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [user]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!user) return null;

  const quickPrompts = [
    "DSA Study Roadmap",
    "ATS Resume Tips",
    "Explain STAR Method",
    "System Design Checklist"
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build context prompts for Gemini
      const systemPrompt = `You are DevPrep Assistant, an expert AI tutor specializing in software engineering placement preparation. 
      You help engineering students master Data Structures & Algorithms (DSA), optimize resumes for ATS checkers, review core subjects (OS, DBMS, Computer Networks), and prepare for mock HR, Technical, and Coding interviews.
      Ensure your answers are technically accurate, professional, structured, and helpful. Always format code snippets using markdown code blocks (e.g. \`\`\`javascript ... \`\`\`).
      Current User profile: Target Role is ${user.profile.targetRole || 'Software Engineer'}, knows skills: ${user.profile.knownSkills?.join(', ') || 'general development'}, target companies: ${user.profile.targetCompanies?.join(', ') || 'top product companies'}.`;

      // Build chat history formatted for Gemini API
      // Since Gemini API expects roles 'user' and 'model'
      const history = messages.slice(1).map(m => ({
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
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

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't formulate a response.";
      
      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      console.warn("Gemini widget API error:", e);
      let errMsg = e.message || 'Please check your internet connection or API settings.';
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('limit exceeded')) {
        errMsg = "⚠️ **Gemini Free Tier Quota Exceeded**. You have hit the rate limit for model requests. Please wait a moment (30–60 seconds) before sending another message.";
      }
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sender: 'assistant',
          text: errMsg,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-cleared',
        sender: 'assistant',
        text: `Chat reset! Let's start fresh. What placement or technical topics can I assist you with now?`,
        timestamp: new Date()
      }
    ]);
  };

  // Basic HTML markdown parser for safe client-side parsing without dependencies
  const formatMessageText = (text: string) => {
    if (!text) return '';
    
    // Escape HTML to prevent XSS
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Format code blocks
    escaped = escaped.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="bg-black/60 p-3 rounded-xl border border-violet-900/40 font-mono text-[10px] my-2.5 overflow-x-auto text-violet-300"><code class="block whitespace-pre">${code.trim()}</code></pre>`;
    });
    
    // Format inline code
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="bg-black/40 px-1.5 py-0.5 rounded font-mono text-pink-400 text-[10px]">$1</code>');
    
    // Format bold text
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    
    // Format bullet lists
    escaped = escaped.replace(/^\s*[-*]\s+(.+)$/gm, '<li class="ml-4 list-disc my-1 text-violet-200">$1</li>');
    
    // Wrap paragraphs
    const paragraphs = escaped.split('\n\n');
    return paragraphs.map(p => {
      if (p.trim().startsWith('<li') || p.trim().startsWith('<pre')) {
        return p;
      }
      return `<p class="mb-2 leading-relaxed">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Box Panel */}
      {isOpen && (
        <div className="w-[380px] h-[520px] bg-[#120a2e]/90 backdrop-blur-md border border-violet-800/40 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden mb-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-12">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-950 to-purple-950 p-4 border-b border-violet-900/30 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="bg-gradient-to-tr from-violet-600 to-pink-500 p-1.5 rounded-lg">
                <Bot className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  DevPrep Copilot
                </h4>
                <p className="text-[9px] text-emerald-400 font-mono flex items-center space-x-1 uppercase tracking-widest mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                  <span>Gemini AI Online</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={clearChat}
                title="Clear Chat History"
                className="p-1.5 rounded-lg text-violet-400 hover:text-white hover:bg-violet-950 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-violet-400 hover:text-white hover:bg-violet-950 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div key={msg.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                  <div className="flex items-start space-x-2 max-w-[85%]">
                    {isAssistant && (
                      <div className="bg-violet-900/30 border border-violet-850 p-1.5 rounded-lg shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                    )}
                    <div 
                      className={`p-3.5 rounded-2xl border text-[11px] leading-relaxed shadow-sm ${
                        isAssistant
                          ? 'bg-[#161030]/50 border-violet-950 text-violet-100 rounded-tl-none'
                          : 'bg-violet-900/20 border-violet-850/60 text-white rounded-tr-none'
                      }`}
                    >
                      {isAssistant && (
                        <div className="flex items-center space-x-1 mb-1 text-pink-400 font-extrabold uppercase text-[8px] font-mono tracking-wider">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>Copilot Response</span>
                        </div>
                      )}
                      <div 
                        dangerouslySetInnerHTML={{ __html: formatMessageText(msg.text) }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[85%]">
                  <div className="bg-violet-900/30 border border-violet-850 p-1.5 rounded-lg shrink-0">
                    <Bot className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                  <div className="p-3 bg-[#161030]/30 border border-violet-950 text-violet-400 text-[11px] flex items-center space-x-2 rounded-2xl rounded-tl-none">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick suggested prompt pills */}
            {messages.length === 1 && !loading && (
              <div className="space-y-1.5 pt-2 border-t border-violet-950/20">
                <p className="text-[9px] text-violet-400 uppercase font-mono tracking-wider font-semibold">Suggested Prompts:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="px-2.5 py-1.5 rounded-xl border border-violet-950 bg-violet-950/20 text-[10px] text-violet-300 font-medium text-left hover:border-violet-650 hover:bg-violet-950/40 hover:text-white transition flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate">{prompt}</span>
                      <ArrowRight className="h-3 w-3 text-violet-500 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }} 
            className="p-3 border-t border-violet-900/20 bg-[#0a051d] flex items-center space-x-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask coding question, optimize resume..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-[#120a2e] text-white px-3.5 py-2.5 rounded-xl border border-violet-950 focus:border-violet-500 focus:outline-none text-[11px] transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:brightness-110 disabled:opacity-40 transition shadow-lg flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 hover:scale-105 hover:rotate-3 active:scale-95 transition-all duration-300 cursor-pointer group relative"
      >
        {isOpen ? (
          <X className="h-5.5 w-5.5" />
        ) : (
          <>
            <MessageSquare className="h-5.5 w-5.5 group-hover:scale-110 transition" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#0b0717] flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
