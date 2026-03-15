import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FlaskConical,
  Compass,
  BarChart3,
  PenLine,
  Send,
  ArrowRight,
  Sparkles,
  BookOpen,
  Brain,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const features = [
    { icon: Compass, label: "Discover", desc: "Literature & ideation", color: "bg-indigo-500" },
    { icon: BarChart3, label: "Analyze", desc: "Data & visualization", color: "bg-violet-500" },
    { icon: PenLine, label: "Write", desc: "Academic writing AI", color: "bg-emerald-500" },
    { icon: Send, label: "Publish", desc: "Journal submission", color: "bg-rose-500" },
  ];

  const stats = [
    { value: "10M+", label: "Research Papers" },
    { value: "50K+", label: "Researchers" },
    { value: "200+", label: "Universities" },
    { value: "95%", label: "Accuracy Rate" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">AI for Research</p>
              <p className="text-xs text-indigo-300">Intelligent Research Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              The Future of
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">
                Academic Research
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-lg leading-relaxed max-w-md">
              Grammarly + Notion + SPSS + ResearchGate — combined into one AI system designed for modern scholars.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                <div className={`w-8 h-8 rounded-lg ${f.color} flex items-center justify-center flex-shrink-0`}>
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{f.label}</p>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-400">Powered by GPT-4</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Used by top universities</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-slate-400">10M+ papers indexed</span>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="w-full lg:w-[440px] flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <p className="text-lg font-bold text-slate-900">AI for Research</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1">Sign in to your research workspace</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@university.edu"
                className="w-full h-11 px-4 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                <span className="text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Forgot password?</a>
            </div>
            <Link to="/dashboard" className="block">
              <Button className="w-full h-11 text-sm font-semibold" size="lg">
                <Sparkles className="w-4 h-4" />
                Sign In to Research Platform
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-3">or</div>
          </div>

          <Link to="/dashboard" className="block mt-4">
            <button className="w-full h-11 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Continue as Demo User
            </button>
          </Link>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to="/dashboard" className="text-indigo-600 font-medium hover:text-indigo-700">
              Start for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
