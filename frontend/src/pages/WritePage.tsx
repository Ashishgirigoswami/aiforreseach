import React, { useState } from "react";
import {
  PenLine, BookOpen, CheckSquare, Repeat, Zap, Quote,
  Sparkles, Copy, Check, Download, RefreshCw, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AgentPanel } from "@/components/ui/AgentPanel";
import { useAgentStream } from "@/hooks/useAgentStream";
import { cn } from "@/lib/utils";

export default function WritePage() {
  const [activeTab, setActiveTab] = useState("outline");
  const [outlineTopic, setOutlineTopic] = useState("");
  const [grammarInput, setGrammarInput] = useState("");
  const [paraphraseInput, setParaphraseInput] = useState("");
  const [paraphraseTone, setParaphraseTone] = useState<"formal" | "technical" | "simplified">("formal");
  const [autocompleteInput, setAutocompleteInput] = useState("");
  const [doiInput, setDoiInput] = useState("");
  const [copied, setCopied] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const outlineAgent = useAgentStream();
  const grammarAgent = useAgentStream();
  const paraphraseAgent = useAgentStream();
  const autocompleteAgent = useAgentStream();
  const citationAgent = useAgentStream();

  type OutlineResult = { title: string; sections: Array<{ title: string; content: string; wordCount?: number }>; estimatedTotal?: number };
  type CitationResult = { apa: string; mla: string; chicago: string };

  const parsedOutline = outlineAgent.parsedJSON<OutlineResult>();
  const parsedCitation = citationAgent.parsedJSON<CitationResult>();

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
          <PenLine className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Write Module</h1>
          <p className="text-sm text-slate-500">LangChain-powered academic writing assistant</p>
        </div>
      </div>

      <Tabs defaultValue="outline" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="outline"><BookOpen className="w-3.5 h-3.5" /> Outline</TabsTrigger>
          <TabsTrigger value="grammar"><CheckSquare className="w-3.5 h-3.5" /> Grammar</TabsTrigger>
          <TabsTrigger value="paraphrase"><Repeat className="w-3.5 h-3.5" /> Paraphrase</TabsTrigger>
          <TabsTrigger value="autocomplete"><Zap className="w-3.5 h-3.5" /> Autocomplete</TabsTrigger>
          <TabsTrigger value="citation"><Quote className="w-3.5 h-3.5" /> Citations</TabsTrigger>
        </TabsList>

        {/* Outline Generator */}
        <TabsContent value="outline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-600" /> Research Outline Generator</CardTitle>
              <CardDescription>AI agent searches literature then generates a complete manuscript outline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input placeholder="Enter your research topic or title..." value={outlineTopic} onChange={(e) => setOutlineTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && outlineTopic.trim() && outlineAgent.invoke("/api/agent/write", { action: "outline", topic: outlineTopic })} className="flex-1" />
                <Button loading={outlineAgent.isLoading} disabled={!outlineTopic.trim()} onClick={() => outlineAgent.invoke("/api/agent/write", { action: "outline", topic: outlineTopic })}>
                  <Sparkles className="w-4 h-4" /> Generate
                </Button>
                {outlineAgent.status === "done" && <Button variant="outline" size="icon" onClick={outlineAgent.reset}><RefreshCw className="w-4 h-4" /></Button>}
              </div>

              {outlineAgent.status !== "idle" && !parsedOutline && (
                <AgentPanel status={outlineAgent.status} tokens={outlineAgent.tokens} toolCalls={outlineAgent.toolCalls} error={outlineAgent.error} />
              )}

              {outlineAgent.status === "done" && parsedOutline && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 leading-tight">{parsedOutline.title}</h3>
                    <div className="flex gap-2">
                      {parsedOutline.estimatedTotal && <span className="text-xs text-slate-400">{parsedOutline.estimatedTotal?.toLocaleString()} words</span>}
                      <Button size="sm" variant="outline" className="text-xs"><Download className="w-3 h-3" /> DOCX</Button>
                      <Button size="sm" variant="outline" className="text-xs"><Download className="w-3 h-3" /> PDF</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(parsedOutline.sections ?? []).map((section) => (
                      <div key={section.title} className="border border-slate-200 rounded-xl overflow-hidden">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                          onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-sm font-semibold text-slate-800">{section.title}</span>
                            {section.wordCount && <span className="text-xs text-slate-400">~{section.wordCount}w</span>}
                          </div>
                          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedSection === section.title && "rotate-180")} />
                        </button>
                        {expandedSection === section.title && (
                          <div className="px-4 pb-4 animate-fade-in">
                            <div className="relative bg-slate-50 rounded-lg p-4 border border-slate-200">
                              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{section.content}</p>
                              <button onClick={() => copyText(section.content, section.title)} className="absolute top-3 right-3 p-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50">
                                {copied === section.title ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {outlineAgent.status === "idle" && (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Agent will search literature then build your complete manuscript structure</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grammar */}
        <TabsContent value="grammar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-emerald-600" /> Grammar & Academic Improvement</CardTitle>
              <CardDescription>Streaming LLM rewriting with academic tone enhancement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Original Text</label>
                  <Textarea placeholder="Paste your paragraph here..." value={grammarInput} onChange={(e) => setGrammarInput(e.target.value)} rows={8} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Improved Version</label>
                  <div className="relative">
                    <div className={cn("min-h-[200px] w-full rounded-lg border px-3 py-2 text-sm leading-relaxed", grammarAgent.isLoading || grammarAgent.tokens ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200 text-slate-400")}>
                      {grammarAgent.tokens || (grammarAgent.status === "idle" ? "Improved text will appear here..." : "")}
                      {grammarAgent.isLoading && <span className="inline-block w-1.5 h-4 bg-emerald-500 rounded animate-pulse ml-0.5" />}
                    </div>
                    {grammarAgent.tokens && (
                      <button onClick={() => copyText(grammarAgent.tokens, "grammar")} className="absolute top-2 right-2 p-1.5 rounded-md bg-white border border-emerald-200">
                        {copied === "grammar" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button loading={grammarAgent.isLoading} disabled={!grammarInput.trim()} onClick={() => { grammarAgent.reset(); grammarAgent.invoke("/api/agent/write", { action: "improve", text: grammarInput }); }}>
                  <Sparkles className="w-4 h-4" /> Improve Writing
                </Button>
                <Button variant="outline" loading={grammarAgent.isLoading} disabled={!grammarInput.trim()} onClick={() => { grammarAgent.reset(); grammarAgent.invoke("/api/agent/write", { action: "grammar", text: grammarInput }); }}>
                  Fix Grammar Only
                </Button>
                {grammarAgent.status !== "idle" && <Button variant="ghost" size="sm" onClick={grammarAgent.reset}><RefreshCw className="w-3.5 h-3.5" /> Reset</Button>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paraphrase */}
        <TabsContent value="paraphrase" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Repeat className="w-4 h-4 text-emerald-600" /> Intelligent Paraphraser</CardTitle>
              <CardDescription>Streaming multi-tone paraphrase with citation integrity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(["formal", "technical", "simplified"] as const).map((tone) => (
                  <button key={tone} onClick={() => { setParaphraseTone(tone); paraphraseAgent.reset(); }}
                    className={cn("px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                      paraphraseTone === tone ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:border-emerald-300")}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    {paraphraseTone === tone && <Badge variant="secondary" className="ml-1.5 text-xs bg-white/20 text-white border-0">Active</Badge>}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Original</label>
                  <Textarea placeholder="Enter text to paraphrase..." value={paraphraseInput} onChange={(e) => setParaphraseInput(e.target.value)} rows={7} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">{paraphraseTone.charAt(0).toUpperCase() + paraphraseTone.slice(1)} Version</label>
                  <div className="relative min-h-[178px] rounded-lg border bg-slate-50 border-slate-200 px-3 py-2 text-sm leading-relaxed">
                    {paraphraseAgent.tokens || (!paraphraseAgent.isLoading && "Paraphrased text appears here...")}
                    {paraphraseAgent.isLoading && <span className="inline-block w-1.5 h-4 bg-emerald-500 rounded animate-pulse ml-0.5" />}
                    {paraphraseAgent.tokens && (
                      <button onClick={() => copyText(paraphraseAgent.tokens, "para")} className="absolute top-2 right-2 p-1.5 rounded-md bg-white border border-slate-200">
                        {copied === "para" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button loading={paraphraseAgent.isLoading} disabled={!paraphraseInput.trim()}
                  onClick={() => { paraphraseAgent.reset(); paraphraseAgent.invoke("/api/agent/write", { action: "paraphrase", text: paraphraseInput, tone: paraphraseTone }); }}>
                  <Repeat className="w-4 h-4" /> Paraphrase ({paraphraseTone})
                </Button>
                {paraphraseAgent.tokens && <Button variant="ghost" size="sm" onClick={paraphraseAgent.reset}><RefreshCw className="w-3.5 h-3.5" /></Button>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Autocomplete */}
        <TabsContent value="autocomplete" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-600" /> Research Section Autocomplete</CardTitle>
              <CardDescription>LLM continues your writing in academic tone with streaming output</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Your Text (AI continues from here)</label>
                <Textarea placeholder="Start writing your research section..." value={autocompleteInput} onChange={(e) => setAutocompleteInput(e.target.value)} rows={6} />
              </div>
              <Button loading={autocompleteAgent.isLoading} disabled={!autocompleteInput.trim()}
                onClick={() => { autocompleteAgent.reset(); autocompleteAgent.invoke("/api/agent/write", { action: "autocomplete", text: autocompleteInput }); }}>
                <Zap className="w-4 h-4" /> Continue Writing
              </Button>
              {autocompleteAgent.status !== "idle" && (
                <div className="animate-fade-in">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">AI Continuation</label>
                  <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">AI-generated continuation</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {autocompleteAgent.tokens}
                      {autocompleteAgent.isLoading && <span className="inline-block w-1.5 h-4 bg-emerald-500 rounded animate-pulse ml-0.5" />}
                    </p>
                    {autocompleteAgent.tokens && !autocompleteAgent.isLoading && (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="text-xs border-emerald-200" onClick={() => copyText(autocompleteAgent.tokens, "auto")}>
                          {copied === "auto" ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-emerald-200"
                          onClick={() => { setAutocompleteInput(prev => prev + " " + autocompleteAgent.tokens); autocompleteAgent.reset(); }}>
                          <CheckSquare className="w-3 h-3" /> Accept & Continue
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs"
                          onClick={() => { autocompleteAgent.reset(); autocompleteAgent.invoke("/api/agent/write", { action: "autocomplete", text: autocompleteInput }); }}>
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Citations */}
        <TabsContent value="citation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Quote className="w-4 h-4 text-emerald-600" /> Citation Generator</CardTitle>
              <CardDescription>Agent looks up CrossRef + Semantic Scholar for accurate citations (APA · MLA · Chicago)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input placeholder="Enter DOI (e.g. 10.1145/3531146) or paper title..." value={doiInput} onChange={(e) => setDoiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doiInput.trim() && citationAgent.invoke("/api/agent/write", { action: "citation", text: doiInput })} className="flex-1" />
                <Button loading={citationAgent.isLoading} disabled={!doiInput.trim()}
                  onClick={() => { citationAgent.reset(); citationAgent.invoke("/api/agent/write", { action: "citation", text: doiInput }); }}>
                  <Sparkles className="w-4 h-4" /> Generate Citations
                </Button>
              </div>

              {citationAgent.status !== "idle" && !parsedCitation && (
                <AgentPanel status={citationAgent.status} tokens={citationAgent.tokens} toolCalls={citationAgent.toolCalls} error={citationAgent.error} />
              )}

              {citationAgent.status === "done" && parsedCitation && (
                <div className="space-y-3 animate-fade-in">
                  {Object.entries(parsedCitation ?? {}).map(([format, text]) => (
                    <div key={format} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="indigo" className="uppercase text-xs font-bold">{format}</Badge>
                        <button onClick={() => copyText(text as string, format)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                          {copied === format ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 font-mono bg-slate-50 p-3 rounded-lg leading-relaxed">{text as string}</p>
                    </div>
                  ))}
                </div>
              )}

              {citationAgent.status === "idle" && (
                <div className="text-center py-12 text-slate-400">
                  <Quote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Agent will look up CrossRef → Semantic Scholar for complete citation metadata</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
