import React, { useState } from "react";
import {
  Send, Shield, AlertTriangle, Star, BookOpen, FileText,
  Sparkles, CheckCircle2, XCircle, ExternalLink,
  TrendingUp, Copy, Check, RefreshCw, Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AgentPanel } from "@/components/ui/AgentPanel";
import { useAgentStream } from "@/hooks/useAgentStream";
import { cn } from "@/lib/utils";

type PlagResult = { overallRisk: number; riskLevel: string; sections: Array<{ section: string; risk: number; issue?: string; suggestion?: string }>; flaggedPhrases: Array<{ phrase: string; reason: string; fix: string }>; recommendations: string[] };
type AIResult = { overallRisk: number; verdict: string; confidence: string; sections: Array<{ section: string; risk: number; signals: string[] }>; humanSignals: string[]; aiSignals: string[]; recommendations: string[] };
type ReviewResult = { verdict: string; scores: Record<string, number>; strengths: string[]; weaknesses: string[]; majorComments: string[]; minorComments: string[]; suggestedJournals: string[] };
type JournalResult = { journals: Array<{ name: string; publisher: string; impactFactor: number; quartile: string; acceptanceRate: string; avgReviewTime: string; openAccess: boolean; whyRecommended: string }> };

export default function PublishPage() {
  const [activeTab, setActiveTab] = useState("plagiarism");
  const [manuscriptInput, setManuscriptInput] = useState("");
  const [journalDomain, setJournalDomain] = useState("");
  const [journalImpact, setJournalImpact] = useState("");
  const [coverLetterTitle, setCoverLetterTitle] = useState("");
  const [coverLetterJournal, setCoverLetterJournal] = useState("");
  const [copied, setCopied] = useState(false);

  const plagAgent = useAgentStream();
  const aiAgent = useAgentStream();
  const reviewAgent = useAgentStream();
  const journalAgent = useAgentStream();
  const coverLetterAgent = useAgentStream();

  const parsedPlag = plagAgent.parsedJSON<PlagResult>();
  const parsedAI = aiAgent.parsedJSON<AIResult>();
  const parsedReview = reviewAgent.parsedJSON<ReviewResult>();
  const parsedJournals = journalAgent.parsedJSON<JournalResult>();

  const getRiskColor = (risk: number) => {
    if (risk <= 10) return { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Low Risk", badge: "success" as const };
    if (risk <= 25) return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Medium Risk", badge: "warning" as const };
    return { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "High Risk", badge: "destructive" as const };
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "emerald";
    if (score >= 70) return "indigo";
    return "amber";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
          <Send className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Publish Module</h1>
          <p className="text-sm text-slate-500">Final review, journal shortlisting, and submission preparation</p>
        </div>
      </div>

      <Tabs defaultValue="plagiarism" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="plagiarism"><Shield className="w-3.5 h-3.5" /> Plagiarism</TabsTrigger>
          <TabsTrigger value="ai-detection"><AlertTriangle className="w-3.5 h-3.5" /> AI Detection</TabsTrigger>
          <TabsTrigger value="review"><Star className="w-3.5 h-3.5" /> Manuscript Review</TabsTrigger>
          <TabsTrigger value="journals"><BookOpen className="w-3.5 h-3.5" /> Journals</TabsTrigger>
          <TabsTrigger value="cover-letter"><FileText className="w-3.5 h-3.5" /> Cover Letter</TabsTrigger>
        </TabsList>

        {/* Plagiarism Checker */}
        <TabsContent value="plagiarism" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-rose-600" /> Plagiarism Checker</CardTitle>
              <CardDescription>Detect potential overlap with published literature and flag similar passages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="Paste your manuscript text here to check for plagiarism..." value={manuscriptInput} onChange={(e) => setManuscriptInput(e.target.value)} rows={5} />
              <div className="flex gap-2">
                <Button onClick={() => { plagAgent.reset(); plagAgent.invoke("/api/agent/publish", { action: "plagiarism", text: manuscriptInput }); }}
                  loading={plagAgent.isLoading} disabled={!manuscriptInput.trim()}>
                  <Shield className="w-4 h-4" /> Check Plagiarism
                </Button>
                {plagAgent.status !== "idle" && <Button variant="outline" size="icon" onClick={plagAgent.reset}><RefreshCw className="w-4 h-4" /></Button>}
              </div>

              {plagAgent.status !== "idle" && !parsedPlag && (
                <AgentPanel status={plagAgent.status} tokens={plagAgent.tokens} toolCalls={plagAgent.toolCalls} error={plagAgent.error} />
              )}

              {plagAgent.status === "done" && parsedPlag && (
                <div className="space-y-4 animate-fade-in">
                  <div className={cn("flex items-center gap-5 p-5 rounded-2xl border", getRiskColor(parsedPlag.overallRisk).bg, getRiskColor(parsedPlag.overallRisk).border)}>
                    <div className="text-center">
                      <p className={cn("text-5xl font-bold", getRiskColor(parsedPlag.overallRisk).text)}>{parsedPlag.overallRisk}%</p>
                      <p className="text-xs text-slate-500 mt-1">Overall Similarity</p>
                    </div>
                    <div className="w-px h-16 bg-slate-200" />
                    <div className="flex-1">
                      <Badge variant={getRiskColor(parsedPlag.overallRisk).badge} className="mb-2 text-sm font-semibold">{parsedPlag.riskLevel ?? getRiskColor(parsedPlag.overallRisk).label}</Badge>
                      {parsedPlag.recommendations?.[0] && <p className="text-sm text-slate-600">{parsedPlag.recommendations[0]}</p>}
                    </div>
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Section-by-Section Analysis</h4>
                    <div className="space-y-2">
                      {(parsedPlag.sections ?? []).map((s) => (
                        <div key={s.section} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="w-28 flex-shrink-0"><p className="text-xs font-medium text-slate-700">{s.section}</p></div>
                          <div className="flex-1"><Progress value={s.risk} max={100} color={s.risk <= 10 ? "emerald" : s.risk <= 25 ? "amber" : "rose"} /></div>
                          <span className={cn("text-sm font-semibold w-10 text-right flex-shrink-0", getRiskColor(s.risk).text)}>{s.risk}%</span>
                          <Badge variant={getRiskColor(s.risk).badge} className="text-xs flex-shrink-0">{getRiskColor(s.risk).label}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  {parsedPlag.flaggedPhrases?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Flagged Passages</h4>
                      {parsedPlag.flaggedPhrases.map((p, i) => (
                        <div key={i} className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-slate-700 italic">&ldquo;{p.phrase}&rdquo;</p>
                          <p className="text-xs text-amber-600 mt-1">{p.reason} — Fix: {p.fix}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Detection */}
        <TabsContent value="ai-detection" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-600" /> AI Detection Risk Score</CardTitle>
              <CardDescription>Analyze your manuscript for AI-generated content risk before journal submission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="Paste your manuscript to analyze AI content risk..." value={manuscriptInput} onChange={(e) => setManuscriptInput(e.target.value)} rows={5} />
              <div className="flex gap-2">
                <Button onClick={() => { aiAgent.reset(); aiAgent.invoke("/api/agent/publish", { action: "ai_detection", text: manuscriptInput }); }}
                  loading={aiAgent.isLoading} disabled={!manuscriptInput.trim()}>
                  <AlertTriangle className="w-4 h-4" /> Analyze AI Risk
                </Button>
                {aiAgent.status !== "idle" && <Button variant="outline" size="icon" onClick={aiAgent.reset}><RefreshCw className="w-4 h-4" /></Button>}
              </div>

              {aiAgent.status !== "idle" && !parsedAI && (
                <AgentPanel status={aiAgent.status} tokens={aiAgent.tokens} toolCalls={aiAgent.toolCalls} error={aiAgent.error} />
              )}

              {aiAgent.status === "done" && parsedAI && (
                <div className="space-y-5 animate-fade-in">
                  <div className={cn("p-5 rounded-2xl border", getRiskColor(parsedAI.overallRisk).bg, getRiskColor(parsedAI.overallRisk).border)}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Overall AI Detection Risk</p>
                        <p className="text-xs text-slate-500">{parsedAI.verdict} — Confidence: {parsedAI.confidence}</p>
                      </div>
                      <Badge variant={getRiskColor(parsedAI.overallRisk).badge}>{getRiskColor(parsedAI.overallRisk).label}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                          <circle cx="50" cy="50" r="40" fill="none"
                            stroke={parsedAI.overallRisk <= 25 ? "#10b981" : parsedAI.overallRisk <= 50 ? "#f59e0b" : "#f43f5e"}
                            strokeWidth="10"
                            strokeDasharray={`${(parsedAI.overallRisk / 100) * 251.2} 251.2`}
                            strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className={cn("text-2xl font-bold", getRiskColor(parsedAI.overallRisk).text)}>{parsedAI.overallRisk}%</p>
                          <p className="text-[10px] text-slate-500">AI Risk</p>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-slate-600">{parsedAI.verdict}</p>
                        <div className="flex flex-wrap gap-1">
                          {parsedAI.humanSignals?.slice(0, 2).map((s, i) => <Badge key={i} variant="success" className="text-xs"><CheckCircle2 className="w-3 h-3" /> {s}</Badge>)}
                          {parsedAI.aiSignals?.slice(0, 2).map((s, i) => <Badge key={i} variant="warning" className="text-xs"><AlertTriangle className="w-3 h-3" /> {s}</Badge>)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Section Risk Breakdown</h4>
                    <div className="space-y-2">
                      {parsedAI.sections?.map((s) => (
                        <div key={s.section} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-medium text-slate-700 w-28 flex-shrink-0">{s.section}</p>
                          <div className="flex-1"><Progress value={s.risk} max={100} color={s.risk <= 20 ? "emerald" : s.risk <= 35 ? "amber" : "rose"} /></div>
                          <span className={cn("text-sm font-semibold w-10 text-right flex-shrink-0", getRiskColor(s.risk).text)}>{s.risk}%</span>
                          {s.signals?.[0] && <span className="text-xs text-slate-400 truncate max-w-[120px]">{s.signals[0]}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manuscript Review */}
        <TabsContent value="review" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Star className="w-4 h-4 text-rose-600" /> Overall Manuscript Review</CardTitle>
              <CardDescription>Comprehensive AI review of clarity, novelty, methodology, and journal readiness</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="Paste your full manuscript for comprehensive review..." value={manuscriptInput} onChange={(e) => setManuscriptInput(e.target.value)} rows={5} />
              <div className="flex gap-2">
                <Button onClick={() => { reviewAgent.reset(); reviewAgent.invoke("/api/agent/publish", { action: "review", text: manuscriptInput }); }}
                  loading={reviewAgent.isLoading} disabled={!manuscriptInput.trim()}>
                  <Sparkles className="w-4 h-4" /> Run Manuscript Review
                </Button>
                {reviewAgent.status !== "idle" && <Button variant="outline" size="icon" onClick={reviewAgent.reset}><RefreshCw className="w-4 h-4" /></Button>}
              </div>

              {reviewAgent.status !== "idle" && !parsedReview && (
                <AgentPanel status={reviewAgent.status} tokens={reviewAgent.tokens} toolCalls={reviewAgent.toolCalls} error={reviewAgent.error} />
              )}

              {reviewAgent.status === "done" && parsedReview && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-200">
                    <Award className="w-10 h-10 text-indigo-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-1">AI Review Verdict</p>
                      <p className="text-lg font-bold text-indigo-900">{parsedReview.verdict}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(parsedReview.scores ?? {}).map(([key, value]) => {
                      const labels: Record<string, string> = { clarity: "Clarity", novelty: "Novelty", methodology: "Methodology", citations: "Citations", journalReadiness: "Journal Ready", overall: "Overall" };
                      return (
                        <div key={key} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                          <p className={cn("text-3xl font-bold mb-1", value >= 85 ? "text-emerald-600" : value >= 70 ? "text-indigo-600" : "text-amber-600")}>{value}</p>
                          <p className="text-xs text-slate-500">{labels[key] ?? key}</p>
                          <Progress value={value} color={getScoreColor(value) as "emerald" | "indigo" | "amber"} className="mt-2" />
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                      </h4>
                      <ul className="space-y-2">
                        {parsedReview.strengths?.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Areas for Improvement
                      </h4>
                      <ul className="space-y-2">
                        {parsedReview.weaknesses?.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                            <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {parsedReview.majorComments?.length > 0 && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Major Comments for Authors</h4>
                      {parsedReview.majorComments.map((c, i) => <p key={i} className="text-xs text-slate-600 mb-1">• {c}</p>)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Shortlisting */}
        <TabsContent value="journals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-rose-600" /> Journal Shortlisting</CardTitle>
              <CardDescription>Find the best journals for your research based on domain and impact factor preference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Research Domain</label>
                  <Input placeholder="e.g., Machine Learning, Healthcare AI, NLP..." value={journalDomain} onChange={(e) => setJournalDomain(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Minimum Impact Factor</label>
                  <Input placeholder="e.g., 5.0" type="number" value={journalImpact} onChange={(e) => setJournalImpact(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { journalAgent.reset(); journalAgent.invoke("/api/agent/publish", { action: "journal_match", domain: journalDomain }); }}
                  loading={journalAgent.isLoading} disabled={!journalDomain.trim()}>
                  <TrendingUp className="w-4 h-4" /> Find Matching Journals
                </Button>
                {journalAgent.status !== "idle" && <Button variant="outline" size="icon" onClick={journalAgent.reset}><RefreshCw className="w-4 h-4" /></Button>}
              </div>

              {journalAgent.status !== "idle" && !parsedJournals && (
                <AgentPanel status={journalAgent.status} tokens={journalAgent.tokens} toolCalls={journalAgent.toolCalls} error={journalAgent.error} />
              )}

              {journalAgent.status === "done" && parsedJournals?.journals && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-sm text-slate-500">{parsedJournals.journals?.length ?? 0} journals matched for &ldquo;{journalDomain}&rdquo;</p>
                  {(parsedJournals.journals ?? []).map((j, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 hover:border-rose-200 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-slate-900">{j.name}</h3>
                            <Badge variant={j.quartile === "Q1" ? "indigo" : "secondary"} className="text-xs">{j.quartile}</Badge>
                            {j.openAccess && <Badge variant="success" className="text-xs">Open Access</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> IF: {j.impactFactor}</span>
                            <span>{j.publisher}</span>
                            <span className="text-emerald-600">Accept: {j.acceptanceRate}</span>
                            <span>Review: {j.avgReviewTime}</span>
                          </div>
                          {j.whyRecommended && <p className="text-xs text-indigo-600 mt-1.5 italic">{j.whyRecommended}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-medium flex-shrink-0">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cover Letter */}
        <TabsContent value="cover-letter" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-rose-600" /> Cover Letter Generator</CardTitle>
              <CardDescription>Auto-generate a professional, journal-specific cover letter for your submission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Paper Title</label>
                  <Input placeholder="Enter your manuscript title..." value={coverLetterTitle} onChange={(e) => setCoverLetterTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">Target Journal</label>
                  <Input placeholder="e.g., Journal of Biomedical Informatics..." value={coverLetterJournal} onChange={(e) => setCoverLetterJournal(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { coverLetterAgent.reset(); coverLetterAgent.invoke("/api/agent/publish", { action: "cover_letter", title: coverLetterTitle, journal: coverLetterJournal }); }}
                  loading={coverLetterAgent.isLoading} disabled={!coverLetterTitle.trim() || !coverLetterJournal.trim()}>
                  <Sparkles className="w-4 h-4" /> Generate Cover Letter
                </Button>
                {coverLetterAgent.status !== "idle" && <Button variant="outline" size="icon" onClick={coverLetterAgent.reset}><RefreshCw className="w-4 h-4" /></Button>}
              </div>

              {coverLetterAgent.status !== "idle" && (
                <div className="animate-fade-in space-y-3">
                  <div className="relative bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cover Letter — Streaming</span>
                      </div>
                      <div className="flex gap-2">
                        {coverLetterAgent.tokens && (
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(coverLetterAgent.tokens); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                            {copied ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                          </Button>
                        )}
                      </div>
                    </div>
                    <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                      {coverLetterAgent.tokens}
                      {coverLetterAgent.isLoading && <span className="inline-block w-1.5 h-4 bg-rose-500 rounded animate-pulse ml-0.5" />}
                    </pre>
                  </div>
                </div>
              )}

              {coverLetterAgent.status === "idle" && (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Fill in the paper title and journal to generate a tailored cover letter</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
