import React, { useState } from "react";
import {
  BarChart3, MessageSquare, Upload, GitBranch, Image as ImageIcon,
  Sparkles, TrendingUp, PieChart, Activity,
  CheckCircle2, Download, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AgentPanel } from "@/components/ui/AgentPanel";
import { useAgentStream } from "@/hooks/useAgentStream";
import {
  BarChart, Bar, LineChart, Line, PieChart as RPieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const mockStats = {
  columns: ["Age", "Score", "Hours_Studied", "Performance"],
  summary: [
    { col: "Age", mean: 24.3, std: 3.2, min: 18, max: 32, missing: 0 },
    { col: "Score", mean: 76.4, std: 11.8, min: 42, max: 98, missing: 2 },
    { col: "Hours_Studied", mean: 5.7, std: 2.1, min: 1, max: 12, missing: 0 },
    { col: "Performance", mean: 3.6, std: 0.8, min: 1, max: 5, missing: 1 },
  ],
  correlation: [
    { x: "Age", y: "Score", r: 0.23 },
    { x: "Hours_Studied", y: "Score", r: 0.71 },
    { x: "Hours_Studied", y: "Performance", r: 0.68 },
    { x: "Age", y: "Performance", r: 0.11 },
  ],
};

const chartData = [
  { name: "Jan", value: 400, score: 240 },
  { name: "Feb", value: 300, score: 139 },
  { name: "Mar", value: 600, score: 380 },
  { name: "Apr", value: 800, score: 520 },
  { name: "May", value: 500, score: 460 },
  { name: "Jun", value: 900, score: 680 },
  { name: "Jul", value: 750, score: 590 },
];

const pieData = [
  { name: "Positive", value: 45, color: "#10b981" },
  { name: "Neutral", value: 30, color: "#94a3b8" },
  { name: "Negative", value: 25, color: "#f43f5e" },
];

const scatterData = Array.from({ length: 30 }, (_, i) => ({
  x: Math.random() * 10 + 1,
  y: Math.random() * 50 + 40 + i * 1.5,
}));

const COLORS = ["#4f46e5", "#7c3aed", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9"];

export default function AnalyzePage() {
  const [activeTab, setActiveTab] = useState("qualitative");
  const [transcript, setTranscript] = useState("");
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [statsShown, setStatsShown] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "scatter">("bar");
  const [flowInput, setFlowInput] = useState("");
  const [illustrationPrompt, setIllustrationPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const qualAgent = useAgentStream();
  const flowAgent = useAgentStream();
  const illustrationAgent = useAgentStream();

  type QualResult = {
    mainThemes: Array<{ theme: string; description: string; codes: string[]; frequency: number; quotes: string[]; sentiment: string }>;
    sentiment: { positive: number; neutral: number; negative: number };
    keyInsights: string[];
    researchImplications: string;
    saturation: string;
  };

  const parsedQual = qualAgent.parsedJSON<QualResult>();
  const mermaidCode = flowAgent.status === "done" ? flowAgent.tokens.replace(/```(?:mermaid)?\s*/g, "").replace(/```\s*$/g, "").trim() : "";

  const simulate = async (fn: () => void) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1600));
    fn();
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analyze & Design Module</h1>
          <p className="text-sm text-slate-500">Qualitative & quantitative analysis with AI-powered visualizations</p>
        </div>
      </div>

      <Tabs defaultValue="qualitative" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="qualitative"><MessageSquare className="w-3.5 h-3.5" /> Qualitative</TabsTrigger>
          <TabsTrigger value="quantitative"><TrendingUp className="w-3.5 h-3.5" /> Quantitative</TabsTrigger>
          <TabsTrigger value="charts"><PieChart className="w-3.5 h-3.5" /> Charts</TabsTrigger>
          <TabsTrigger value="flowchart"><GitBranch className="w-3.5 h-3.5" /> Flowchart</TabsTrigger>
          <TabsTrigger value="illustration"><ImageIcon className="w-3.5 h-3.5" /> Illustration</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Qualitative Analysis */}
        <TabsContent value="qualitative" className="mt-6 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-violet-600" /> Qualitative Data Analysis</CardTitle>
              <CardDescription>Paste interview transcripts or qualitative text for AI-powered thematic analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={"Paste interview transcript or qualitative data here...\n\nExample: 'The participants expressed significant concerns about digital privacy...'"}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={5}
              />
              <div className="flex gap-2">
                <Button onClick={() => { qualAgent.reset(); qualAgent.invoke("/api/agent/analyze", { action: "qualitative", text: transcript }); }}
                  loading={qualAgent.isLoading} disabled={!transcript.trim()}>
                  <Sparkles className="w-4 h-4" /> Run Thematic Analysis
                </Button>
                {qualAgent.status !== "idle" && <Button variant="outline" size="icon" onClick={qualAgent.reset}><RefreshCw className="w-4 h-4" /></Button>}
              </div>

              {qualAgent.status !== "idle" && !parsedQual && (
                <AgentPanel status={qualAgent.status} tokens={qualAgent.tokens} toolCalls={qualAgent.toolCalls} error={qualAgent.error} />
              )}

              {qualAgent.status === "done" && parsedQual && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Positive", value: parsedQual.sentiment?.positive ?? 0, color: "emerald" },
                      { label: "Neutral", value: parsedQual.sentiment?.neutral ?? 0, color: "amber" },
                      { label: "Negative", value: parsedQual.sentiment?.negative ?? 0, color: "rose" },
                    ].map((s) => (
                      <div key={s.label} className={cn("p-4 rounded-xl border text-center",
                        s.color === "emerald" ? "bg-emerald-50 border-emerald-200" :
                        s.color === "amber" ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200")}>
                        <p className={cn("text-2xl font-bold", s.color === "emerald" ? "text-emerald-600" : s.color === "amber" ? "text-amber-600" : "text-rose-600")}>
                          {s.value}%
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.label} Sentiment</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Identified Themes & Codes ({parsedQual.mainThemes?.length ?? 0})</h4>
                    <div className="space-y-2">
                      {(parsedQual.mainThemes ?? []).map((theme, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }}>
                            {theme.frequency}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{theme.theme}</p>
                            <p className="text-xs text-slate-400">{theme.description}</p>
                            {theme.codes?.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {theme.codes.map((c) => <span key={c} className="text-xs bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">{c}</span>)}
                              </div>
                            )}
                          </div>
                          <Badge variant={theme.sentiment === "positive" ? "success" : theme.sentiment === "negative" ? "destructive" : "secondary"} className="text-xs flex-shrink-0 capitalize">
                            {theme.sentiment}
                          </Badge>
                          <div className="w-24 flex-shrink-0">
                            <Progress value={theme.frequency} max={30} color={theme.sentiment === "positive" ? "emerald" : "rose"} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {parsedQual.researchImplications && (
                      <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <p className="text-xs font-semibold text-indigo-700 mb-1">Research Implications</p>
                        <p className="text-xs text-slate-700">{parsedQual.researchImplications}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">Sentiment Distribution</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <RPieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                          {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </RPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Quantitative Analysis */}
        <TabsContent value="quantitative" className="mt-6 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-violet-600" /> Quantitative Data Analysis</CardTitle>
              <CardDescription>Upload CSV data for automated statistical analysis, correlations, and regression</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!csvUploaded ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-all cursor-pointer" onClick={() => setCsvUploaded(true)}>
                  <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700">Upload CSV or Excel file</p>
                  <p className="text-xs text-slate-400 mt-1">student_performance_data.csv • research_data.xlsx</p>
                  <Button className="mt-4" variant="outline" size="sm"><Upload className="w-3.5 h-3.5" /> Upload Dataset</Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-800">student_performance.csv</p>
                      <p className="text-xs text-emerald-600">200 rows · 4 columns · Loaded successfully</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setCsvUploaded(false); setStatsShown(false); }}>Change</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => simulate(() => setStatsShown(true))} loading={loading}>
                      <Activity className="w-4 h-4" /> Run Analysis
                    </Button>
                    {statsShown && <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5" /> Export Report</Button>}
                  </div>
                  {statsShown && (
                    <div className="space-y-5 animate-fade-in">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Descriptive Statistics</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-100">
                                {["Variable", "Mean", "Std Dev", "Min", "Max", "Missing"].map((h) => (
                                  <th key={h} className="text-left px-3 py-2 text-slate-600 font-semibold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {mockStats.summary.map((row, i) => (
                                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                  <td className="px-3 py-2 font-medium text-slate-800">{row.col}</td>
                                  <td className="px-3 py-2 text-slate-600">{row.mean}</td>
                                  <td className="px-3 py-2 text-slate-600">{row.std}</td>
                                  <td className="px-3 py-2 text-slate-600">{row.min}</td>
                                  <td className="px-3 py-2 text-slate-600">{row.max}</td>
                                  <td className="px-3 py-2">
                                    {row.missing > 0 ? <Badge variant="warning" className="text-xs">{row.missing}</Badge> : <span className="text-emerald-600">✓</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Correlation Matrix</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {mockStats.correlation.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-xs text-slate-600">{c.x} ↔ {c.y}</span>
                              <span className={cn("text-sm font-bold", Math.abs(c.r) > 0.5 ? "text-indigo-600" : "text-slate-500")}>r = {c.r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Score Distribution</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Charts */}
        <TabsContent value="charts" className="mt-6 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PieChart className="w-4 h-4 text-violet-600" /> Graph & Chart Generator</CardTitle>
              <CardDescription>Generate publication-ready charts from your research data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["bar", "line", "pie", "scatter"] as const).map((type) => (
                  <button key={type} onClick={() => setChartType(type)}
                    className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                      chartType === type ? "bg-violet-600 text-white border-violet-600 shadow-sm" : "bg-white text-slate-600 border-slate-300 hover:border-violet-300")}>
                    {type === "bar" ? <BarChart3 className="w-4 h-4" /> : type === "line" ? <TrendingUp className="w-4 h-4" /> : type === "pie" ? <PieChart className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    {type.charAt(0).toUpperCase() + type.slice(1)} Chart
                  </button>
                ))}
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 capitalize">{chartType} Chart — Research Data Visualization</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs"><RefreshCw className="w-3 h-3" /> Regenerate</Button>
                    <Button size="sm" variant="outline" className="text-xs"><Download className="w-3 h-3" /> Export PNG</Button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === "bar" ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip /><Legend />
                      <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Responses" />
                      <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} name="Score" />
                    </BarChart>
                  ) : chartType === "line" ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} name="Responses" />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Score" />
                    </LineChart>
                  ) : chartType === "pie" ? (
                    <RPieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </RPieChart>
                  ) : (
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="x" name="Hours Studied" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="y" name="Score" tick={{ fontSize: 11 }} />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                      <Scatter data={scatterData} fill="#7c3aed" />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Flowchart */}
        <TabsContent value="flowchart" className="mt-6 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitBranch className="w-4 h-4 text-violet-600" /> Flowchart / Diagram Generator</CardTitle>
              <CardDescription>Describe your research process and generate Mermaid.js flowcharts automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder={"Describe your research flowchart...\n\nExample: 'Start with research problem, conduct literature review, identify gap, collect data, analyze, discuss results, publish'"} value={flowInput} onChange={(e) => setFlowInput(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button onClick={() => { flowAgent.reset(); flowAgent.invoke("/api/agent/analyze", { action: "flowchart", text: flowInput }); }}
                  loading={flowAgent.isLoading} disabled={!flowInput.trim()}>
                  <GitBranch className="w-4 h-4" /> Generate Flowchart
                </Button>
                {flowAgent.status !== "idle" && <Button variant="outline" size="icon" onClick={flowAgent.reset}><RefreshCw className="w-4 h-4" /></Button>}
              </div>
              {flowAgent.status !== "idle" && !mermaidCode && (
                <AgentPanel status={flowAgent.status} tokens={flowAgent.tokens} toolCalls={flowAgent.toolCalls} error={flowAgent.error} />
              )}
              {mermaidCode && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400 font-mono">mermaid.js</span>
                      <Button size="sm" variant="ghost" className="text-xs text-slate-400"><Download className="w-3 h-3" /> Export SVG</Button>
                    </div>
                    <pre className="text-xs text-emerald-400 font-mono leading-relaxed">{mermaidCode}</pre>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-8">
                    <div className="flex flex-col items-center space-y-2 text-sm">
                      {[
                        { text: "Research Problem", style: "bg-indigo-600 text-white rounded-xl px-6 py-2.5 font-semibold shadow-sm" },
                        { text: "↓", style: "text-slate-400 text-xl" },
                        { text: "Literature Review", style: "bg-violet-100 text-violet-800 border border-violet-300 rounded-xl px-6 py-2.5 font-medium" },
                        { text: "↓", style: "text-slate-400 text-xl" },
                        { text: "Gap Identified?", style: "bg-amber-100 text-amber-800 border border-amber-300 rounded-xl px-6 py-2.5 font-medium" },
                        { text: "↓ Yes", style: "text-emerald-500 font-medium" },
                        { text: "Formulate Hypotheses", style: "bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl px-6 py-2.5 font-medium" },
                        { text: "↓", style: "text-slate-400 text-xl" },
                        { text: "Data Collection → Analysis → Results → Publish", style: "bg-slate-100 text-slate-700 rounded-xl px-6 py-2 text-xs font-mono" },
                      ].map((item, i) => (
                        <div key={i} className={item.style}>{item.text}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 5: Scientific Illustration */}
        <TabsContent value="illustration" className="mt-6 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-violet-600" /> Scientific Illustration Generator</CardTitle>
              <CardDescription>Generate AI-powered scientific schematics and diagrams for your research</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder={"Describe the scientific diagram you need...\n\nExample: 'Neural network architecture diagram with input layer, 3 hidden layers, and output layer.'"} value={illustrationPrompt} onChange={(e) => setIllustrationPrompt(e.target.value)} rows={3} />
              <div className="flex gap-2">
                <Button onClick={() => { illustrationAgent.reset(); illustrationAgent.invoke("/api/agent/analyze", { action: "illustration_prompt", text: illustrationPrompt }); }}
                  loading={illustrationAgent.isLoading} disabled={!illustrationPrompt.trim()}>
                  <Sparkles className="w-4 h-4" /> Generate Description
                </Button>
                {illustrationAgent.status !== "idle" && <Button variant="outline" size="icon" onClick={illustrationAgent.reset}><RefreshCw className="w-4 h-4" /></Button>}
              </div>
              {illustrationAgent.status !== "idle" && (
                <AgentPanel status={illustrationAgent.status} tokens={illustrationAgent.tokens} toolCalls={illustrationAgent.toolCalls} error={illustrationAgent.error} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
