'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { buildGeminiKeyPool } from '../../lib/geminiKeys';
import {
  FileText,
  Upload,
  AlertCircle,
  ArrowRight,
  Loader2,
  Calendar,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  BadgeCheck,
  Wand2,
  FileInput,
  FileSearch,
  CheckCircle2
} from 'lucide-react';

interface ResumeSectionScore {
  section: string;
  score: number;
  notes: string;
}

interface ResumeAnalysisResult {
  _id?: string;
  fileName: string;
  atsScore: number;
  grade?: string;
  sectionScores?: ResumeSectionScore[];
  missingKeywords?: string[];
  atsRisks?: string[];
  rewriteRecommendations?: string[];
  projectEnhancements?: { before: string; after: string; impact?: string }[];
  feedback?: string;
  sourceType?: string;
  jobDescription?: string;
  matchedKeywords?: string[];
  jobKeywords?: string[];
  createdAt?: string;
}

export default function ResumeIntelligence() {
  const { token, resumes, setResumes, addResume, geminiKey } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<ResumeAnalysisResult | null>(null);
  const [liveResult, setLiveResult] = useState<ResumeAnalysisResult | null>(null);

  const activeReport = liveResult || selectedReport;

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/resume/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setResumes(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const parseGeminiHeader = () => buildGeminiKeyPool(geminiKey).join(',');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setError('');
    }
  };

  const resetForm = () => {
    setFile(null);
    setResumeText('');
    setJobDescription('');
    setError('');
    setLiveResult(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file && !resumeText.trim()) {
      setError('Upload a resume file or paste resume text first.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (resumeText.trim()) {
      formData.append('resume_text', resumeText.trim());
    }
    if (jobDescription.trim()) {
      formData.append('job_description', jobDescription.trim());
    }

    const headers: Record<string, string> = {};
    const geminiHeader = parseGeminiHeader();
    if (geminiHeader) {
      headers['X-Gemini-Key'] = geminiHeader;
    }

    try {
      const parseResponse = await fetch('http://localhost:8000/analyze-resume', {
        method: 'POST',
        headers,
        body: formData
      });

      const parseResult = await parseResponse.json();

      if (!parseResponse.ok) {
        throw new Error(parseResult.detail || 'Failed to analyze resume');
      }

      const result: ResumeAnalysisResult = {
        fileName: file?.name || 'Pasted Resume Text',
        ...parseResult
      };
      setLiveResult(result);

      if (token) {
        const dbResponse = await fetch('http://localhost:5000/api/resume/analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: result.fileName,
            atsScore: result.atsScore,
            grade: result.grade || '',
            sectionScores: result.sectionScores || [],
            missingKeywords: result.missingKeywords || [],
            atsRisks: result.atsRisks || [],
            rewriteRecommendations: result.rewriteRecommendations || [],
            projectEnhancements: result.projectEnhancements || [],
            feedback: result.feedback || '',
            sourceType: result.sourceType || (file ? 'pdf' : 'text'),
            jobDescription: jobDescription.trim(),
            matchedKeywords: result.matchedKeywords || [],
            jobKeywords: result.jobKeywords || []
          })
        });

        const dbReport = await dbResponse.json();
        if (!dbResponse.ok) {
          throw new Error(dbReport.message || 'Failed to save analysis results');
        }

        addResume(dbReport);
        setSelectedReport(dbReport);
      }

      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Error occurred. Please verify backend configurations.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-4xl border border-violet-950/50 bg-[#0c071c]/70 p-6 md:p-8 shadow-2xl shadow-black/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.18),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-violet-300">
              <Sparkles className="h-3.5 w-3.5" /> Smart ATS Analysis
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
              ATS Resume Checker
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-200/90 md:text-base">
              Upload your resume, paste raw text, or compare it against a job description to get an ATS-style score, risks, keyword gaps, and rewrite suggestions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200/80 md:min-w-70">
            <div className="rounded-2xl border border-violet-950/70 bg-black/20 p-3">
              <div className="text-violet-400">Inputs</div>
              <div className="mt-1 text-white">File or pasted text</div>
            </div>
            <div className="rounded-2xl border border-violet-950/70 bg-black/20 p-3">
              <div className="text-violet-400">Output</div>
              <div className="mt-1 text-white">Score, risks, rewrites</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="glass-panel border-violet-950 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <Upload className="h-4 w-4 text-violet-400" />
              Upload or Drop Resume
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAnalyze} className="space-y-4">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`group relative block rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  dragActive ? 'border-pink-400 bg-violet-950/40' : 'border-violet-900 bg-[#0a051d]/40 hover:border-violet-700'
                }`}
              >
                <input type="file" accept=".pdf,.txt" onChange={handleFileChange} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <FileInput className="mx-auto h-10 w-10 text-violet-400" />
                <p className="mt-3 text-sm font-semibold text-violet-100">
                  {file ? file.name : 'Drag & drop resume PDF/TXT here'}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-violet-400/80">
                  or click to browse
                </p>
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300">
                  <FileText className="h-3.5 w-3.5" /> Paste Resume Text
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste resume text here if PDF extraction is weak or if you want to check plain text directly..."
                  className="min-h-45 w-full rounded-2xl border border-violet-950 bg-[#0a051d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-violet-500 focus:border-violet-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300">
                  <FileSearch className="h-3.5 w-3.5" /> Job Description Optional
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description to get stronger keyword and alignment suggestions..."
                  className="min-h-37.5 w-full rounded-2xl border border-violet-950 bg-[#0a051d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-violet-500 focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 to-pink-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {uploading ? 'Analyzing...' : 'Check ATS Score'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-900 bg-violet-950/30 px-4 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-950/50"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </form>
          </div>

          <div className="glass-panel border-violet-950 p-6">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Previous Reports</h3>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {resumes.length > 0 ? (
                resumes.map((report: ResumeAnalysisResult) => {
                  const isSelected = selectedReport?._id === report._id;
                  return (
                    <button
                      key={report._id}
                      onClick={() => setSelectedReport(report)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${
                        isSelected ? 'border-violet-500 bg-violet-950/60 text-white' : 'border-violet-950 bg-violet-950/10 text-violet-300 hover:border-violet-900'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="truncate text-xs font-semibold">{report.fileName}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[9px] font-mono text-violet-400">
                          <Calendar className="h-3 w-3" />
                          <span>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Saved analysis'}</span>
                        </p>
                      </div>
                      <span className="rounded-full bg-violet-950/80 px-2 py-0.5 text-xs font-bold font-mono text-violet-300">
                        {report.atsScore}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="py-6 text-center text-xs text-violet-400">No previous analysis logs.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {activeReport ? (
            <div className="glass-panel space-y-6 border-violet-950 p-6">
              <div className="flex flex-col gap-4 border-b border-violet-950/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="max-w-sm truncate text-base font-bold text-white">{activeReport.fileName}</h4>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.3em] text-violet-400">
                    {activeReport.sourceType || 'pdf'} analysis
                    {activeReport.createdAt ? ` • ${new Date(activeReport.createdAt).toLocaleString()}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-[10px] uppercase tracking-[0.25em] text-violet-400">ATS Score</span>
                    <div className="text-3xl font-black text-white">{activeReport.atsScore}/100</div>
                  </div>
                  <div className="rounded-2xl border border-violet-950 bg-violet-950/30 px-4 py-3 text-center">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-violet-400">Grade</div>
                    <div className="text-2xl font-black text-white">{activeReport.grade || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-violet-950 bg-[#120a2e]/40 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300">
                    <BadgeCheck className="h-4 w-4 text-emerald-400" /> Summary
                  </div>
                  <p className="mt-3 text-sm leading-6 text-violet-100">{activeReport.feedback || 'No feedback available.'}</p>
                </div>

                <div className="rounded-2xl border border-violet-950 bg-[#120a2e]/40 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300">
                    <ShieldAlert className="h-4 w-4 text-amber-400" /> Risks
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-violet-100">
                    {(activeReport.atsRisks?.length ? activeReport.atsRisks : ['No risks captured']).map((risk, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-violet-950 bg-[#120a2e]/40 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300">
                    <Wand2 className="h-4 w-4 text-pink-400" /> Recommendations
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-violet-100">
                    {(activeReport.rewriteRecommendations?.length ? activeReport.rewriteRecommendations : ['No rewrite recommendations available']).map((item, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-pink-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <h5 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Section Breakdown</h5>
                  <div className="space-y-3">
                    {(activeReport.sectionScores?.length ? activeReport.sectionScores : []).map((section) => (
                      <div key={section.section} className="rounded-2xl border border-violet-950 bg-violet-950/10 p-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <span>{section.section}</span>
                          <span>{section.score}/100</span>
                        </div>
                        <div className="mt-2 flex gap-1">
                          {Array.from({ length: 10 }).map((_, index) => {
                            const active = section.score >= (index + 1) * 10;
                            return (
                              <div
                                key={index}
                                className={`h-2 flex-1 rounded-full ${active ? 'bg-linear-to-r from-violet-500 to-pink-500' : 'bg-[#0a051d]'}`}
                              />
                            );
                          })}
                        </div>
                        <p className="mt-2 text-[11px] leading-5 text-violet-300">{section.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Keyword Signals</h5>
                  <div className="rounded-2xl border border-violet-950 bg-violet-950/10 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400">Missing Keywords</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(activeReport.missingKeywords?.length ? activeReport.missingKeywords : ['No missing keywords captured']).map((keyword, index) => (
                        <span key={index} className="rounded-lg border border-rose-950 bg-rose-950/20 px-2.5 py-1 text-xs text-rose-300">
                          {keyword}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400">Matched Keywords</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(activeReport.matchedKeywords?.length ? activeReport.matchedKeywords : ['No matched keyword list']).map((keyword, index) => (
                        <span key={index} className="rounded-lg border border-emerald-950 bg-emerald-950/20 px-2.5 py-1 text-xs text-emerald-300">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {activeReport.projectEnhancements?.length ? (
                <div>
                  <h5 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">Ready-to-use Rewrites</h5>
                  <div className="space-y-4">
                    {activeReport.projectEnhancements.map((proj, index) => (
                      <div key={index} className="overflow-hidden rounded-2xl border border-violet-950">
                        <div className="flex items-start gap-3 border-b border-violet-950 bg-rose-950/10 p-4 text-xs">
                          <span className="rounded bg-rose-900/30 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-rose-400">Before</span>
                          <p className="leading-relaxed text-rose-200/90">{proj.before}</p>
                        </div>
                        <div className="flex items-start gap-3 bg-emerald-950/10 p-4 text-xs">
                          <span className="rounded bg-emerald-900/30 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-400">After</span>
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold leading-relaxed text-emerald-200">{proj.after}</p>
                            {proj.impact && <p className="text-[10px] font-mono text-violet-400">Impact: {proj.impact}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="glass-panel flex flex-col items-center justify-center border-violet-950 p-20 text-center">
              <FileText className="mb-3 h-10 w-10 text-violet-500" />
              <h4 className="text-sm font-bold text-white">No active resume analysis</h4>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-violet-400">
                Upload a resume or paste text to generate an ATS-style score, keyword gaps, risks, and rewrite recommendations.
              </p>
            </div>
          )}

          <div className="glass-panel border-violet-950 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> What You’ll Get
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                'Overall ATS-style score and grade',
                'Section-by-section scoring breakdown',
                'ATS risks and why they matter',
                'Missing keyword suggestions',
                'Ready-to-use rewrite recommendations',
                'Optional job description alignment'
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-violet-950 bg-violet-950/10 px-4 py-3 text-sm text-violet-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
