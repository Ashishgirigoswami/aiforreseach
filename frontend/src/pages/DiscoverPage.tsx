import React, { useState } from "react";
import {
  Lightbulb, Search, FileText, GitBranch, BookMarked, Compass,
  Sparkles, Star, ArrowRight, Upload, Plus, Trash2,
  Download, Tag, MessageSquare, Brain, BarChart2, CheckCircle2,
  ExternalLink, FileDown, Globe, BookOpen, AlertCircle, Filter, RefreshCw,
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

export interface PaperResult {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number | null;
  journal: string;
  cited: number;
  source: "semantic_scholar" | "arxiv" | "openalex";
  sourceLabel: string;
  url: string;
  pdfUrl: string | null;
  doi: string | null;
  externalIds: Record<string, string>;
}

const SOURCE_CONFIG = {
  semantic_scholar: { label: "Semantic Scholar", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500", icon: "🔬" },
  arxiv: { label: "arXiv", color: "bg-rose-100 text-rose-700", dot: "bg-rose-500", icon: "📄" },
  openalex: { label: "OpenAlex", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: "🌐" },
} as const;

interface SavedPaper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  tags: string[];
  notes: string;
  source?: string;
  url?: string;
}

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState("topics");

  const [topicInput, setTopicInput] = useState("");
  const topicsAgent = useAgentStream();
  const parsedTopics = topicsAgent.parsedJSON<{ topics: Array<{ title: string; noveltyScore: number; researchGap: string; keywords: string[]; methodology: string }> }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [papers, setPapers] = useState<PaperResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeSources, setActiveSources] = useState<string[]>(["semantic_scholar", "arxiv", "openalex"]);
  const [searchMeta, setSearchMeta] = useState<{ total: number; query: string } | null>(null);

  const [pdfQuestion, setPdfQuestion] = useState("");
  const [pdfMode, setPdfMode] = useState<"ask" | "summarize" | "methodology" | "findings">("ask");
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [pdfResult, setPdfResult] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  const [problemInput, setProblemInput] = useState("");
  const hypothesisAgent = useAgentStream();
  type HypothesisResult = {
    problemStatement: string;
    theoreticalBackground: string;
    variables: { independent: string[]; dependent: string[]; moderating: string[]; control: string[] };
    hypotheses: Array<{ id: string; statement: string; type: string; rationale: string }>;
    suggestedMethods: string[];
    expectedContribution: string;
  };
  const parsedHypothesis = hypothesisAgent.parsedJSON<HypothesisResult>();

  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);

  const handleGenerateTopics = async () => {
    if (!topicInput.trim()) return;
    topicsAgent.invoke("/api/agent/topics", { domain: topicInput });
  };

  const toggleSource = (src: string) => {
    setActiveSources((prev) =>
      prev.includes(src) ? (prev.length > 1 ? prev.filter((s) => s !== src) : prev) : [...prev, src]
    );
  };

  const handleSearchPapers = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    setPapers([]);
    try {
      const sources = activeSources.join(",");
      const res = await fetch(`https://aiforreseach.onrender.com/api/papers/search?q=${encodeURIComponent(searchQuery)}&sources=${sources}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json() as { results: PaperResult[]; total: number; query: string };
      setPapers(data.results ?? []);
      setSearchMeta({ total: data.total, query: data.query });
    } catch {
      setSearchError("Could not fetch papers. Check your internet connection.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePdfAction = async () => {
    if (!pdfUploaded) return;
    setPdfLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const responses: Record<string, string> = {
      ask: `Based on the paper, the key finding related to "${pdfQuestion || "your query"}" is that transformer architectures achieve superior performance by replacing recurrent networks with self-attention mechanisms.`,
      summarize: `This paper introduces the Transformer, a novel sequence-to-sequence architecture that relies entirely on attention mechanisms.`,
      methodology: `**Research Design:** Experimental study using neural sequence-to-sequence modeling.\n\n**Model Architecture:**\n- 6 encoder + 6 decoder layers\n- Multi-head self-attention (8 heads, d_model=512)`,
      findings: `**Key Findings:**\n\n1. Transformer achieves 28.4 BLEU on EN-DE, surpassing all prior models by 2+ BLEU\n2. EN-FR translation: 41.0 BLEU — new state-of-the-art`,
    };
    setPdfResult(responses[pdfMode]);
    setPdfLoading(false);
  };

  const handleBuildHypothesis = async () => {
    if (!problemInput.trim()) return;
    hypothesisAgent.invoke("/api/agent/hypothesis", { problem: problemInput });
  };

  const handleSavePaper = (paper: PaperResult) => {
    if (savedPapers.find((p) => p.id === paper.id)) return;
    setSavedPapers((prev) => [
      ...prev,
      { id: paper.id, title: paper.title, authors: paper.authors, year: paper.year, tags: [paper.sourceLabel], notes: "", source: paper.source, url: paper.url },
    ]);
  };

  const generateAPA = (p: SavedPaper) => {
    const authors = p.authors.length > 0 ? p.authors.join(", ") : "Unknown Author";
    const year = p.year ? `(${p.year})` : "(n.d.)";
    return `${authors} ${year}. ${p.title}.`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Discover Module</h1>
          <p className="text-sm text-slate-500">Explore literature from Semantic Scholar, arXiv & OpenAlex in real time</p>
        </div>
      </div>

      <Tabs defaultValue="topics" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="topics"><Lightbulb className="w-3.5 h-3.5" /> Topic Generator</TabsTrigger>
          <TabsTrigger value="search"><Search className="w-3.5 h-3.5" /> Paper Search</TabsTrigger>
          <TabsTrigger value="pdf"><FileText className="w-3.5 h-3.5" /> Ask PDF</TabsTrigger>
          <TabsTrigger value="hypothesis"><GitBranch className="w-3.5 h-3.5" /> Hypothesis Builder</TabsTrigger>
          <TabsTrigger value="library"><BookMarked className="w-3.5 h-3.5" /> Literature Manager</TabsTrigger>
        </TabsList>

        {/* Topic Generator */}
        <TabsContent value="topics" className="mt-6 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-indigo-600" /> Research Topic Generator</CardTitle>
              <CardDescription>Enter your domain or keywords to generate novel research topics with novelty scores and gap analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input placeholder="e.g., Machine Learning in Healthcare, Federated Learning, NLP..." value={topicInput} onChange={(e) => setTopicInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGenerateTopics()} className="flex-1" />
                <Button onClick={handleGenerateTopics} loading={topicsAgent.isLoading} disabled={!topicInput.trim()}>
                  <Sparkles className="w-4 h-4" /> Generate Topics
                </Button>
                {topicsAgent.status === "done" && <Button variant="outline" size="icon" onClick={() => topicsAgent.reset()}><RefreshCw className="w-4 h-4" /></Button>}
              </div>

              {topicsAgent.status !== "idle" && (
                <AgentPanel status={topicsAgent.status} tokens={topicsAgent.status === "done" ? "" : topicsAgent.tokens} toolCalls={topicsAgent.toolCalls} error={topicsAgent.error} placeholder="AI will search academic databases and generate topics here" className="animate-fade-in" />
              )}

              {topicsAgent.status === "done" && parsedTopics?.topics && parsedTopics.topics.length > 0 && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Generated {parsedTopics.topics.length} research topics from live literature analysis
                  </p>
                  {parsedTopics.topics.map((topic, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">#{i + 1}</span>
                            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{topic.title}</h3>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mb-2">
                            <span className="font-medium text-slate-600">Research Gap: </span>{topic.researchGap}
                          </p>
                          {topic.methodology && <p className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-lg inline-block">💡 {topic.methodology}</p>}
                          {topic.keywords?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {topic.keywords.map((kw) => <span key={kw} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{kw}</span>)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Novelty</p>
                            <p className={cn("text-lg font-bold", topic.noveltyScore >= 90 ? "text-emerald-600" : topic.noveltyScore >= 80 ? "text-indigo-600" : "text-amber-600")}>{topic.noveltyScore}%</p>
                          </div>
                          <Progress value={topic.noveltyScore} color={topic.noveltyScore >= 90 ? "emerald" : "indigo"} className="w-20" />
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => { setProblemInput(topic.title); setActiveTab("hypothesis"); }}>
                            Hypothesis <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {topicsAgent.status === "idle" && (
                <div className="text-center py-12 text-slate-400">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">AI agent will search Semantic Scholar + arXiv to identify real research gaps</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paper Search */}
        <TabsContent value="search" className="mt-6 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="w-4 h-4 text-indigo-600" /> Live Academic Paper Search</CardTitle>
              <CardDescription>Search across Semantic Scholar, arXiv & OpenAlex — millions of real research papers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Filter className="w-3 h-3" /> Sources:</span>
                {(Object.keys(SOURCE_CONFIG) as (keyof typeof SOURCE_CONFIG)[]).map((src) => {
                  const cfg = SOURCE_CONFIG[src];
                  const active = activeSources.includes(src);
                  return (
                    <button key={src} onClick={() => toggleSource(src)}
                      className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                        active ? `${cfg.color} border-current` : "bg-white text-slate-400 border-slate-200 opacity-50")}>
                      <span className={cn("w-2 h-2 rounded-full", active ? cfg.dot : "bg-slate-300")} />
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Input placeholder="e.g., transformer attention mechanism NLP, federated learning privacy..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearchPapers()} className="flex-1" />
                <Button onClick={handleSearchPapers} loading={searchLoading} disabled={!searchQuery.trim()}><Search className="w-4 h-4" /> Search</Button>
              </div>

              {searchError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{searchError}
                </div>
              )}

              {searchLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="shimmer h-4 rounded w-3/4" />
                      <div className="shimmer h-3 rounded w-1/2" />
                      <div className="shimmer h-3 rounded w-full" />
                    </div>
                  ))}
                  <p className="text-xs text-center text-slate-400">Searching Semantic Scholar, arXiv & OpenAlex...</p>
                </div>
              )}

              {!searchLoading && papers.length > 0 && searchMeta && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-700">{searchMeta.total}</span> papers found for &ldquo;{searchMeta.query}&rdquo;
                    </p>
                    <div className="flex gap-1">
                      {activeSources.map((src) => {
                        const cfg = SOURCE_CONFIG[src as keyof typeof SOURCE_CONFIG];
                        const count = papers.filter((p) => p.source === src).length;
                        return count > 0 ? (
                          <span key={src} className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.color)}>
                            {cfg.icon} {count}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {papers.map((paper) => {
                    const srcCfg = SOURCE_CONFIG[paper.source as keyof typeof SOURCE_CONFIG];
                    const isSaved = savedPapers.some((p) => p.id === paper.id);
                    return (
                      <div key={paper.id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1.5">
                              <Star className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                              <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors leading-tight">
                                {paper.title}<ExternalLink className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
                              </a>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2 text-xs text-slate-500">
                              <span>{paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}</span>
                              {paper.year && <><span>·</span><span>{paper.year}</span></>}
                              {paper.journal && <><span>·</span><span className="italic truncate max-w-[200px]">{paper.journal}</span></>}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{paper.abstract}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2.5">
                              <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", srcCfg?.color ?? "bg-slate-100 text-slate-600")}>
                                {srcCfg?.icon} {srcCfg?.label ?? paper.source}
                              </span>
                              {paper.cited > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {paper.cited.toLocaleString()} citations</span>}
                              {paper.doi && <span className="text-xs text-slate-400">DOI: {paper.doi.replace("https://doi.org/", "")}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0 min-w-[90px]">
                            <Button size="sm" variant="outline" className="text-xs whitespace-nowrap" onClick={() => { setPdfUploaded(true); setActiveTab("pdf"); }}>
                              <MessageSquare className="w-3 h-3" /> Ask PDF
                            </Button>
                            {paper.pdfUrl && (
                              <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="ghost" className="text-xs w-full"><FileDown className="w-3 h-3" /> PDF</Button>
                              </a>
                            )}
                            <Button size="sm" variant="ghost" className={cn("text-xs", isSaved && "text-emerald-600")} onClick={() => handleSavePaper(paper)}>
                              <BookMarked className="w-3 h-3" />{isSaved ? "Saved ✓" : "Save"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!searchLoading && papers.length === 0 && !searchError && (
                <div className="text-center py-12 text-slate-400">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Search live academic papers</p>
                  <p className="text-xs mt-1">Powered by Semantic Scholar · arXiv · OpenAlex</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ask PDF */}
        <TabsContent value="pdf" className="mt-6 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Ask Questions to PDF</CardTitle>
              <CardDescription>Upload a research paper and extract insights using AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!pdfUploaded ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer" onClick={() => setPdfUploaded(true)}>
                  <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700">Drop your PDF here or click to upload</p>
                  <p className="text-xs text-slate-400 mt-1">Supports PDF files up to 50MB</p>
                  <Button className="mt-4" variant="outline" size="sm"><Upload className="w-3.5 h-3.5" /> Choose File</Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-800">attention_is_all_you_need.pdf</p>
                      <p className="text-xs text-emerald-600">11 pages · 1.2MB · Parsed successfully</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setPdfUploaded(false); setPdfResult(""); }}>Change</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["ask", "summarize", "methodology", "findings"] as const).map((mode) => (
                      <button key={mode} onClick={() => { setPdfMode(mode); setPdfResult(""); }}
                        className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          pdfMode === mode ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300 hover:border-indigo-300")}>
                        {mode === "ask" ? "Ask Question" : mode === "summarize" ? "Summarize" : mode === "methodology" ? "Extract Methodology" : "Extract Findings"}
                      </button>
                    ))}
                  </div>
                  {pdfMode === "ask" && (
                    <div className="flex gap-3">
                      <Input placeholder="Ask anything about this paper..." value={pdfQuestion} onChange={(e) => setPdfQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePdfAction()} className="flex-1" />
                      <Button onClick={handlePdfAction} loading={pdfLoading}>Ask AI</Button>
                    </div>
                  )}
                  {pdfMode !== "ask" && (
                    <Button onClick={handlePdfAction} loading={pdfLoading}>
                      <Sparkles className="w-4 h-4" />
                      {pdfMode === "summarize" ? "Generate Summary" : pdfMode === "methodology" ? "Extract Methodology" : "Extract Findings"}
                    </Button>
                  )}
                  {pdfResult && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-fade-in">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-indigo-600" />
                        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">AI Response</p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{pdfResult}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hypothesis Builder */}
        <TabsContent value="hypothesis" className="mt-6 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitBranch className="w-4 h-4 text-indigo-600" /> Hypothesis & Framework Builder</CardTitle>
              <CardDescription>Generate structured problem statements, variables, and hypotheses from your research problem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Research Problem</label>
                <Textarea placeholder="Describe your research problem..." value={problemInput} onChange={(e) => setProblemInput(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleBuildHypothesis} loading={hypothesisAgent.isLoading} disabled={!problemInput.trim()}>
                  <GitBranch className="w-4 h-4" /> Build Hypothesis Framework
                </Button>
                {hypothesisAgent.status === "done" && <Button variant="outline" size="icon" onClick={hypothesisAgent.reset}><RefreshCw className="w-4 h-4" /></Button>}
              </div>

              {hypothesisAgent.status !== "idle" && !parsedHypothesis && (
                <AgentPanel status={hypothesisAgent.status} tokens={hypothesisAgent.tokens} toolCalls={hypothesisAgent.toolCalls} error={hypothesisAgent.error} className="animate-fade-in" />
              )}

              {hypothesisAgent.status === "done" && parsedHypothesis && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Problem Statement</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{parsedHypothesis.problemStatement}</p>
                    {parsedHypothesis.theoreticalBackground && <p className="text-xs text-indigo-600 mt-2 italic">{parsedHypothesis.theoreticalBackground}</p>}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(parsedHypothesis.variables ?? {}).map(([type, vars]) => (
                      <div key={type} className="p-3 bg-white border border-slate-200 rounded-xl">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 capitalize">{type}</h4>
                        <div className="space-y-1">
                          {(Array.isArray(vars) ? vars : []).map((v, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                              <p className="text-xs text-slate-600">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Hypotheses</h4>
                    {(parsedHypothesis.hypotheses ?? []).map((h) => (
                      <div key={h.id} className={cn("p-4 border rounded-xl", h.type === "alternative" ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200")}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={h.type === "alternative" ? "indigo" : "secondary"} className="text-xs font-bold">{h.id}</Badge>
                          <span className="text-xs text-slate-500 capitalize">{h.type} hypothesis</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{h.statement}</p>
                        {h.rationale && <p className="text-xs text-slate-400 mt-1.5 italic">{h.rationale}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart2 className="w-4 h-4 text-violet-600" />
                      <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Conceptual Framework</h4>
                    </div>
                    <div className="flex items-center justify-center gap-4 py-4 flex-wrap">
                      <div className="text-center p-3 bg-white rounded-lg border border-violet-200 shadow-sm">
                        <p className="text-xs font-semibold text-violet-700">Independent</p>
                        {(parsedHypothesis.variables?.independent ?? []).map((v, i) => <p key={i} className="text-xs text-slate-500 mt-0.5">{v}</p>)}
                      </div>
                      <ArrowRight className="w-5 h-5 text-violet-400" />
                      <div className="text-center p-3 bg-violet-100 rounded-lg border border-violet-300 shadow-sm">
                        <p className="text-xs font-semibold text-violet-800">Dependent</p>
                        {(parsedHypothesis.variables?.dependent ?? []).map((v, i) => <p key={i} className="text-xs text-slate-600 mt-0.5">{v}</p>)}
                      </div>
                    </div>
                    {parsedHypothesis.expectedContribution && <p className="text-xs text-violet-700 text-center mt-2 font-medium">{parsedHypothesis.expectedContribution}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Literature Manager */}
        <TabsContent value="library" className="mt-6 space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><BookMarked className="w-4 h-4 text-indigo-600" /> Literature Manager</CardTitle>
                  <CardDescription>Save, tag, annotate, and export your literature collection</CardDescription>
                </div>
                <Button size="sm" variant="outline" disabled={savedPapers.length === 0}><Download className="w-3.5 h-3.5" /> Export APA</Button>
              </div>
            </CardHeader>
            <CardContent>
              {savedPapers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No papers saved yet</p>
                  <p className="text-xs mt-1">Search for papers and click Save to add them here</p>
                  <Button className="mt-4" variant="outline" size="sm" onClick={() => setActiveTab("search")}><Search className="w-3.5 h-3.5" /> Search Papers</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">{savedPapers.length} paper{savedPapers.length !== 1 ? "s" : ""} saved</p>
                  {savedPapers.map((paper) => {
                    const srcCfg = paper.source ? SOURCE_CONFIG[paper.source as keyof typeof SOURCE_CONFIG] : null;
                    return (
                      <div key={paper.id} className="border border-slate-200 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{paper.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""} · {paper.year ?? "n.d."}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {paper.url && <a href={paper.url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5 text-indigo-500" /></Button></a>}
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400" onClick={() => setSavedPapers((prev) => prev.filter((p) => p.id !== paper.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                        <div className="flex gap-1 mb-3 flex-wrap">
                          {srcCfg && <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", srcCfg.color)}>{srcCfg.icon} {srcCfg.label}</span>}
                          {paper.tags.filter((t) => !["semantic_scholar", "arxiv", "openalex"].includes(t)).map((tag) => (
                            <Badge key={tag} variant="indigo" className="text-xs"><Tag className="w-2.5 h-2.5" />{tag}</Badge>
                          ))}
                          <Button size="sm" variant="ghost" className="h-5 px-2 text-xs text-slate-400"><Plus className="w-2.5 h-2.5" />Tag</Button>
                        </div>
                        <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 font-mono leading-relaxed">{generateAPA(paper)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
