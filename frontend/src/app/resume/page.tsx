'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { FileText, Upload, AlertCircle, CheckCircle2, ArrowRight, Loader2, Calendar } from 'lucide-react';

export default function ResumeIntelligence() {
  const { token, resumes, setResumes, addResume, geminiKey } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/resume/history', {
        headers: { 'Authorization': `Bearer ${token}` }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF resumes are supported');
        setFile(null);
      } else {
        setError('');
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (geminiKey) {
      headers['X-Gemini-Key'] = geminiKey;
    }

    try {
      // 1. Send to FastAPI parser
      const parseResponse = await fetch('http://localhost:8000/analyze-resume', {
        method: 'POST',
        headers,
        body: formData
      });

      const parseResult = await parseResponse.json();

      if (!parseResponse.ok) {
        throw new Error(parseResult.detail || 'Failed to parse resume PDF');
      }

      // 2. Save result to MongoDB via Express
      const dbResponse = await fetch('http://localhost:5000/api/resume/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          atsScore: parseResult.atsScore,
          missingKeywords: parseResult.missingKeywords || [],
          projectEnhancements: parseResult.projectEnhancements || [],
          feedback: parseResult.feedback || ''
        })
      });

      const dbReport = await dbResponse.json();

      if (!dbResponse.ok) {
        throw new Error(dbReport.message || 'Failed to save analysis results');
      }

      // Update state
      addResume(dbReport);
      setSelectedReport(dbReport);
      setFile(null);
      
    } catch (err: any) {
      setError(err.message || 'Error occurred. Please verify backend configurations.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-wide">
          Resume Intelligence & ATS Analyzer
        </h2>
        <p className="text-xs text-violet-400 mt-1">
          Evaluate resume formatting and scoring. Upgrade bullet points and resolve keyword gaps.
        </p>
      </div>

      {/* Grid: Upload & History / Active Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Upload Box & Previous Analysis list */}
        <div className="space-y-6 lg:col-span-1">
          {/* Upload Card */}
          <div className="glass-panel p-6 border-violet-950">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-4 flex items-center space-x-1.5">
              <Upload className="h-4 w-4 text-violet-400" />
              <span>Upload PDF Resume</span>
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/20 border border-rose-950 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border border-dashed border-violet-950 bg-[#0a051d]/40 rounded-xl p-6 text-center hover:border-violet-700 transition relative">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <FileText className="mx-auto h-8 w-8 text-violet-500 mb-2" />
                <p className="text-xs text-violet-300 font-semibold">
                  {file ? file.name : "Select PDF resume"}
                </p>
                <p className="text-[10px] text-violet-500/80 mt-1 uppercase font-mono">
                  MAX 5MB
                </p>
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold text-xs hover:brightness-110 disabled:opacity-40 transition flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                ) : (
                  <>
                    <span>Analyze Resume ATS</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History Card */}
          <div className="glass-panel p-6 border-violet-950">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider mb-4">
              Previous Reports
            </h3>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {resumes.length > 0 ? (
                resumes.map((report) => {
                  const isSelected = selectedReport?._id === report._id;
                  return (
                    <button
                      key={report._id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition ${
                        isSelected
                          ? 'bg-violet-950/60 border-violet-500 text-white'
                          : 'bg-violet-950/10 border-violet-950 text-violet-300 hover:border-violet-900'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold truncate">{report.fileName}</p>
                        <p className="text-[9px] text-violet-400 font-mono mt-0.5 flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                      <span className="text-xs font-bold font-mono bg-violet-950/80 px-2 py-0.5 rounded-full text-violet-400">
                        {report.atsScore} pts
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-violet-400 text-center py-6">No previous analysis logs.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active report visualizer */}
        <div className="lg:col-span-2 space-y-6">
          {selectedReport ? (
            <div className="glass-panel p-6 border-violet-950 space-y-6">
              {/* Top Summary Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-violet-950/40 pb-4 gap-4">
                <div>
                  <h4 className="text-base font-bold text-white truncate max-w-sm">
                    {selectedReport.fileName}
                  </h4>
                  <p className="text-[10px] text-violet-400 mt-0.5">
                    ANALYZED ON {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] text-violet-400 uppercase font-mono block">ATS Score</span>
                    <span className="text-2xl font-black text-white">{selectedReport.atsScore}/100</span>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${
                    selectedReport.atsScore >= 75 ? 'bg-emerald-500' : selectedReport.atsScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}></div>
                </div>
              </div>

              {/* Overall Feedback */}
              <div>
                <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-2">
                  ATS Feedback Review
                </h5>
                <p className="text-xs text-violet-200 leading-relaxed bg-[#120a2e]/30 border border-violet-950 p-4 rounded-xl">
                  {selectedReport.feedback}
                </p>
              </div>

              {/* Missing keywords */}
              <div>
                <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-3">
                  Missing Keywords Detect
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.missingKeywords.length > 0 ? (
                    selectedReport.missingKeywords.map((kw: string, idx: number) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 rounded-lg bg-rose-950/20 border border-rose-950 text-rose-300 text-xs font-medium"
                      >
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-950 px-3 py-1.5 rounded-xl">
                      ✓ No missing core keywords identified! Great job matching skills.
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-side Project optimization */}
              <div>
                <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4">
                  Project Description Enhancers
                </h5>

                <div className="space-y-4">
                  {selectedReport.projectEnhancements.map((proj: any, idx: number) => (
                    <div key={idx} className="border border-violet-950 rounded-2xl overflow-hidden">
                      {/* Before (Weak description) */}
                      <div className="p-4 bg-rose-950/10 border-b border-violet-950 text-xs flex items-start space-x-3">
                        <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-rose-900/30 text-rose-400 mt-0.5">
                          Before
                        </span>
                        <p className="text-rose-300/80 leading-relaxed">{proj.before}</p>
                      </div>

                      {/* After (ATS Optimized description) */}
                      <div className="p-4 bg-emerald-950/10 text-xs flex items-start space-x-3">
                        <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400 mt-0.5">
                          After
                        </span>
                        <div className="flex-1 space-y-1">
                          <p className="text-emerald-300 font-semibold leading-relaxed">{proj.after}</p>
                          {proj.impact && (
                            <p className="text-[10px] text-violet-400 font-mono mt-1">
                              Impact: {proj.impact}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-20 border-violet-950 text-center flex flex-col items-center justify-center">
              <FileText className="h-10 w-10 text-violet-500 mb-3" />
              <h4 className="text-sm font-bold text-white">No active resume analysis</h4>
              <p className="text-xs text-violet-400 mt-1 max-w-xs leading-relaxed">
                Upload your resume in PDF format in the upload area to calculate your placement ATS compatibility.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
