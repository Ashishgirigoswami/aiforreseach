import React from "react";
import { useLocation } from "react-router-dom";
import { Bell, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Research Dashboard", subtitle: "Your AI-powered research workspace" },
  "/discover": { title: "Discover", subtitle: "Explore literature & generate research ideas" },
  "/analyze": { title: "Analyze & Design", subtitle: "Data analysis & visualization tools" },
  "/write": { title: "Write", subtitle: "Academic writing assistant" },
  "/publish": { title: "Publish", subtitle: "Manuscript review & journal submission" },
};

export function Header() {
  const location = useLocation();
  const pathname = location.pathname;
  const pageInfo = pageTitles[pathname] || { title: "AI for Research", subtitle: "Research Platform" };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{pageInfo.title}</h1>
        <p className="text-xs text-slate-500 hidden sm:block">{pageInfo.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search research..."
            className="pl-9 pr-4 py-1.5 text-sm bg-slate-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 placeholder:text-slate-400 text-slate-700"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold ml-1">
          R
        </div>
      </div>
    </header>
  );
}
