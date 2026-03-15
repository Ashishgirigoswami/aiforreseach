"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Brain, Globe, Search, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Zap } from "lucide-react";
import type { ToolCall, AgentStatus } from "@/hooks/useAgentStream";

interface AgentPanelProps {
  status: AgentStatus;
  tokens: string;
  toolCalls: ToolCall[];
  error: string | null;
  placeholder?: string;
  className?: string;
  showRaw?: boolean;
}

const statusConfig: Record<AgentStatus, { label: string; color: string; icon: React.ElementType }> = {
  idle: { label: "Ready", color: "text-slate-400", icon: Brain },
  thinking: { label: "Thinking...", color: "text-indigo-600", icon: Brain },
  searching: { label: "Searching databases...", color: "text-violet-600", icon: Search },
  writing: { label: "Writing response...", color: "text-emerald-600", icon: Zap },
  done: { label: "Complete", color: "text-emerald-600", icon: CheckCircle2 },
  error: { label: "Error", color: "text-rose-600", icon: AlertCircle },
};

const toolIconMap: Record<string, React.ElementType> = {
  "Semantic Scholar": Search,
  "arXiv": Globe,
  "CrossRef": Globe,
  "OpenAlex Trends": Globe,
};

export function AgentPanel({ status, tokens, toolCalls, error, placeholder, className, showRaw }: AgentPanelProps) {
  const [expandedTool, setExpandedTool] = React.useState<number | null>(null);
  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;
  const isActive = status !== "idle" && status !== "done" && status !== "error";

  if (status === "idle" && !tokens && !error) {
    return (
      <div className={cn("rounded-xl border border-dashed border-slate-200 p-8 text-center", className)}>
        <Brain className="w-10 h-10 text-slate-200 mx-auto mb-2" />
        <p className="text-sm text-slate-400">{placeholder ?? "AI response will appear here"}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white overflow-hidden", className)}>
      {/* Status bar */}
      <div className={cn("flex items-center gap-2 px-4 py-2.5 border-b", isActive ? "bg-indigo-50 border-indigo-100" : status === "done" ? "bg-emerald-50 border-emerald-100" : status === "error" ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100")}>
        {isActive ? (
          <Loader2 className={cn("w-3.5 h-3.5 animate-spin flex-shrink-0", cfg.color)} />
        ) : (
          <StatusIcon className={cn("w-3.5 h-3.5 flex-shrink-0", cfg.color)} />
        )}
        <span className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</span>
        <div className="ml-auto flex items-center gap-1">
          {toolCalls.length > 0 && (
            <span className="text-xs text-slate-400">{toolCalls.length} tool{toolCalls.length > 1 ? "s" : ""} used</span>
          )}
        </div>
      </div>

      {/* Tool calls */}
      {toolCalls.length > 0 && (
        <div className="border-b border-slate-100 divide-y divide-slate-100">
          {toolCalls.map((tc, i) => {
            const ToolIcon = toolIconMap[tc.tool] ?? Globe;
            const isExpanded = expandedTool === i;
            return (
              <div key={i} className="bg-slate-50/80">
                <button
                  onClick={() => setExpandedTool(isExpanded ? null : i)}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                    tc.status === "done" ? "bg-emerald-100" : tc.status === "error" ? "bg-rose-100" : "bg-violet-100")}>
                    {tc.status === "running" ? (
                      <Loader2 className="w-3 h-3 text-violet-600 animate-spin" />
                    ) : tc.status === "done" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                    )}
                  </div>
                  <ToolIcon className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">{tc.tool}</span>
                  <span className="text-xs text-slate-400 truncate flex-1">— {tc.input}</span>
                  {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                </button>
                {isExpanded && tc.output && (
                  <div className="px-4 pb-3">
                    <pre className="text-xs text-slate-600 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto max-h-48 whitespace-pre-wrap">
                      {tc.output}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main output */}
      {error ? (
        <div className="p-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rose-700">Error</p>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
        </div>
      ) : tokens ? (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">AI Response</span>
          </div>
          {showRaw ? (
            <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{tokens}</pre>
          ) : (
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{tokens}</div>
          )}
          {isActive && (
            <span className="inline-block w-1.5 h-4 bg-indigo-500 rounded animate-pulse ml-0.5" />
          )}
        </div>
      ) : null}
    </div>
  );
}
