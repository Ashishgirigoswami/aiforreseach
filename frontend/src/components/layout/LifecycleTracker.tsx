import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Compass, BarChart3, PenLine, Send, CheckCircle2, Circle } from "lucide-react";

const stages = [
  { label: "Discover", href: "/discover", icon: Compass, color: "indigo" },
  { label: "Analyze", href: "/analyze", icon: BarChart3, color: "violet" },
  { label: "Write", href: "/write", icon: PenLine, color: "emerald" },
  { label: "Publish", href: "/publish", icon: Send, color: "rose" },
];

const stageOrder = ["/discover", "/analyze", "/write", "/publish"];

export function LifecycleTracker() {
  const location = useLocation();
  const pathname = location.pathname;
  const currentIndex = stageOrder.findIndex((s) => pathname.startsWith(s));

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="flex items-center justify-between max-w-lg">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-6 hidden lg:block">
          Research Lifecycle
        </p>
        <div className="flex items-center gap-0">
          {stages.map((stage, index) => {
            const isCompleted = currentIndex > index;
            const isActive = currentIndex === index;

            const colorMap: Record<string, string> = {
              indigo: "text-indigo-600 bg-indigo-50 border-indigo-200",
              violet: "text-violet-600 bg-violet-50 border-violet-200",
              emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
              rose: "text-rose-600 bg-rose-50 border-rose-200",
            };

            const activeColor = colorMap[stage.color];

            return (
              <React.Fragment key={stage.href}>
                <Link
                  to={stage.href}
                  className="flex items-center gap-2 group"
                >
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                      isActive
                        ? activeColor
                        : isCompleted
                        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                        : "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : isActive ? (
                      <stage.icon className="w-3.5 h-3.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">{stage.label}</span>
                  </div>
                </Link>
                {index < stages.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-px mx-1",
                      isCompleted ? "bg-emerald-300" : "bg-slate-200"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
