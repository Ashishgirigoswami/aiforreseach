import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  BarChart3,
  PenLine,
  Send,
  Plus,
  TrendingUp,
  Clock,
  FileText,
  ArrowRight,
  Sparkles,
  Target,
  BookMarked,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modules = [
  {
    title: "Discover",
    description: "Explore literature, generate research ideas, and build your foundation",
    href: "/discover",
    icon: Compass,
    gradient: "from-indigo-500 to-blue-600",
    lightBg: "bg-indigo-50",
    textColor: "text-indigo-600",
    borderColor: "border-indigo-200",
    features: ["Topic Generator", "Paper Search", "Ask PDF", "Hypothesis Builder", "Literature Manager"],
    count: "5 tools",
    progress: 0,
  },
  {
    title: "Analyze & Design",
    description: "Analyze qualitative & quantitative data with AI-powered visualizations",
    href: "/analyze",
    icon: BarChart3,
    gradient: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50",
    textColor: "text-violet-600",
    borderColor: "border-violet-200",
    features: ["Qualitative Analysis", "Quantitative Stats", "Chart Generator", "Flowchart Builder", "Illustrations"],
    count: "5 tools",
    progress: 0,
  },
  {
    title: "Write",
    description: "AI writing assistant for academic papers, abstracts, and citations",
    href: "/write",
    icon: PenLine,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    features: ["Outline Generator", "Grammar Improvement", "Paraphraser", "Autocomplete", "Citation Generator"],
    count: "5 tools",
    progress: 0,
  },
  {
    title: "Publish",
    description: "Final checks, journal shortlisting, and cover letter generation",
    href: "/publish",
    icon: Send,
    gradient: "from-rose-500 to-orange-500",
    lightBg: "bg-rose-50",
    textColor: "text-rose-600",
    borderColor: "border-rose-200",
    features: ["Plagiarism Check", "AI Detection Risk", "Manuscript Review", "Journal Shortlist", "Cover Letter"],
    count: "5 tools",
    progress: 0,
  },
];

const recentActivity = [
  { action: "Generated research topics", module: "Discover", time: "2 min ago", icon: Compass, color: "text-indigo-500" },
  { action: "Analyzed qualitative data", module: "Analyze", time: "1 hour ago", icon: BarChart3, color: "text-violet-500" },
  { action: "Generated paper outline", module: "Write", time: "3 hours ago", icon: PenLine, color: "text-emerald-500" },
  { action: "Ran plagiarism check", module: "Publish", time: "Yesterday", icon: Send, color: "text-rose-500" },
];

export default function DashboardPage() {
  const [showNewProject, setShowNewProject] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 p-8 text-white shadow-lg shadow-indigo-500/20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-10 right-20 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-white/5" />
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span className="text-sm text-indigo-200">AI Research Assistant</span>
            </div>
            <h2 className="text-2xl font-bold">Good morning, Researcher!</h2>
            <p className="text-indigo-200 mt-1 max-w-lg">
              Your AI-powered research platform is ready. Start by discovering literature or continue your existing project.
            </p>
            <div className="flex gap-3 mt-6">
              <Link to="/discover">
                <Button className="bg-white text-indigo-700 hover:bg-indigo-50 border-0 shadow-md font-semibold">
                  <Compass className="w-4 h-4" />
                  Start Discovering
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                onClick={() => setShowNewProject(true)}
              >
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2">
            <div className="bg-white/10 rounded-xl p-4 text-center min-w-[120px]">
              <p className="text-3xl font-bold">4</p>
              <p className="text-xs text-indigo-200 mt-1">Research Modules</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center min-w-[120px]">
              <p className="text-3xl font-bold">20</p>
              <p className="text-xs text-indigo-200 mt-1">AI-Powered Tools</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Papers Discovered", value: "0", icon: BookMarked, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Analyses Run", value: "0", icon: Activity, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Words Written", value: "0", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Score", value: "—", icon: Target, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Research Modules</h2>
          <span className="text-sm text-slate-500">20 AI tools across 4 modules</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modules.map((module) => (
            <Link key={module.title} to={module.href} className="group">
              <Card className={cn("card-hover border overflow-hidden", module.borderColor, "hover:shadow-lg transition-all duration-300")}>
                <div className={cn("h-1.5 w-full bg-gradient-to-r", module.gradient)} />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm", module.gradient)}>
                        <module.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{module.title}</h3>
                        <p className="text-xs text-slate-500">{module.count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Ready</Badge>
                      <ArrowRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", module.textColor)} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">{module.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {module.features.map((f) => (
                      <span key={f} className={cn("text-xs px-2 py-0.5 rounded-full", module.lightBg, module.textColor, "font-medium")}>
                        {f}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity + Quick Start */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {recentActivity.length === 0 ? (
                <div className="text-center py-10">
                  <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No activity yet. Start by exploring a module!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <item.icon className={cn("w-4 h-4", item.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium">{item.action}</p>
                        <p className="text-xs text-slate-400">{item.module}</p>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-base text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[
                { step: "1", text: "Choose a research topic", href: "/discover" },
                { step: "2", text: "Search & discover papers", href: "/discover" },
                { step: "3", text: "Analyze your data", href: "/analyze" },
                { step: "4", text: "Write your manuscript", href: "/write" },
                { step: "5", text: "Publish-ready review", href: "/publish" },
              ].map((item) => (
                <Link key={item.step} to={item.href} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/60 hover:bg-white transition-colors group">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {item.step}
                  </div>
                  <span className="text-sm text-slate-700 flex-1">{item.text}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewProject(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-fade-in">
            <h3 className="text-xl font-semibold text-slate-900 mb-1">Create New Research Project</h3>
            <p className="text-sm text-slate-500 mb-5">Set up your research workspace</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Title</label>
                <input type="text" placeholder="e.g., Climate Change Impact on Urban Agriculture" className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Research Domain</label>
                <input type="text" placeholder="e.g., Environmental Science, Computer Science..." className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Research Type</label>
                <select className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
                  <option>Qualitative Research</option>
                  <option>Quantitative Research</option>
                  <option>Mixed Methods</option>
                  <option>Systematic Review</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewProject(false)}>Cancel</Button>
              <Link to="/discover" className="flex-1">
                <Button className="w-full">
                  <Plus className="w-4 h-4" />
                  Create & Discover
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
