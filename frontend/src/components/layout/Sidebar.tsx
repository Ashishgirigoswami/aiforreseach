import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Compass,
  BarChart3,
  PenLine,
  Send,
  LayoutDashboard,
  FlaskConical,
  BookOpen,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
  {
    label: "Discover",
    href: "/discover",
    icon: Compass,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    badge: "AI",
  },
  {
    label: "Analyze & Design",
    href: "/analyze",
    icon: BarChart3,
    color: "text-violet-600",
    bg: "bg-violet-50",
    badge: "AI",
  },
  {
    label: "Write",
    href: "/write",
    icon: PenLine,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    badge: "AI",
  },
  {
    label: "Publish",
    href: "/publish",
    icon: Send,
    color: "text-rose-600",
    bg: "bg-rose-50",
    badge: "AI",
  },
];

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col min-h-screen fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-slate-100">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-indigo flex items-center justify-center shadow-md">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">AI for Research</p>
            <p className="text-xs text-slate-400">Research Platform</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">Modules</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? `${item.bg} ${item.color}`
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", isActive ? item.bg : "bg-slate-100 group-hover:bg-white")}>
                <item.icon className={cn("w-4 h-4", isActive ? item.color : "text-slate-500")} />
              </div>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <p className="text-xs font-semibold text-indigo-900">Research Assistant</p>
          </div>
          <p className="text-xs text-indigo-600/70">AI-powered research workflow at your fingertips</p>
        </div>

        <div className="flex items-center gap-3 mt-4 px-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            R
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Researcher</p>
            <p className="text-xs text-slate-400 truncate">researcher@uni.edu</p>
          </div>
          <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
