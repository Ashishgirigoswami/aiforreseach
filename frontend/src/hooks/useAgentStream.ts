"use client";
import { useState, useCallback, useRef } from "react";

export interface AgentStreamEvent {
  type: "token" | "tool_start" | "tool_end" | "final" | "error" | "status";
  content?: string;
  tool?: string;
  input?: string;
  output?: string;
  status?: string;
}

export interface ToolCall {
  tool: string;
  input: string;
  output?: string;
  status: "running" | "done" | "error";
}

export type AgentStatus = "idle" | "thinking" | "searching" | "writing" | "done" | "error";

export interface UseAgentStreamReturn {
  tokens: string;
  toolCalls: ToolCall[];
  status: AgentStatus;
  isLoading: boolean;
  error: string | null;
  invoke: (endpoint: string, payload: Record<string, unknown>) => Promise<void>;
  reset: () => void;
  parsedJSON: <T>() => T | null;
}

export function useAgentStream(): UseAgentStreamReturn {
  const [tokens, setTokens] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const tokensRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setTokens("");
    setToolCalls([]);
    setStatus("idle");
    setError(null);
    tokensRef.current = "";
  }, []);

  const invoke = useCallback(async (endpoint: string, payload: Record<string, unknown>) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    reset();
    setStatus("thinking");

    try {
      const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
      const res = await fetch(`${base}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: AgentStreamEvent;
          try {
            event = JSON.parse(raw);
          } catch {
            continue;
          }

          switch (event.type) {
            case "token":
              tokensRef.current += event.content ?? "";
              setTokens(tokensRef.current);
              break;

            case "tool_start":
              setStatus("searching");
              setToolCalls((prev) => [
                ...prev,
                {
                  tool: formatToolName(event.tool ?? ""),
                  input: tryParseInput(event.input ?? ""),
                  status: "running",
                },
              ]);
              break;

            case "tool_end":
              setStatus("writing");
              setToolCalls((prev) => {
                const next = [...prev];
                const last = next.findLast((t: ToolCall) => t.status === "running");
                if (last) last.status = "done";
                return next;
              });
              break;

            case "status":
              break;

            case "final":
              setStatus("done");
              break;

            case "error":
              setError(event.content ?? "Unknown error");
              setStatus("error");
              break;
          }
        }
      }

      setStatus("done");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus("error");
    }
  }, [reset]);

  const parsedJSON = useCallback(<T>(): T | null => {
    const raw = tokensRef.current;
    const blockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = blockMatch ? blockMatch[1].trim() : raw.trim();
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      const objMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (objMatch) {
        try {
          return JSON.parse(objMatch[1]) as T;
        } catch { /* noop */ }
      }
      return null;
    }
  }, []);

  return {
    tokens,
    toolCalls,
    status,
    isLoading: status === "thinking" || status === "searching" || status === "writing",
    error,
    invoke,
    reset,
    parsedJSON,
  };
}

function formatToolName(name: string): string {
  const map: Record<string, string> = {
    search_semantic_scholar: "Semantic Scholar",
    search_arxiv: "arXiv",
    lookup_citation: "CrossRef",
    get_research_trends: "OpenAlex Trends",
  };
  return map[name] ?? name.replace(/_/g, " ");
}

function tryParseInput(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return (parsed as { query?: string; topic?: string; input?: string }).query
      ?? (parsed as { query?: string; topic?: string; input?: string }).topic
      ?? (parsed as { query?: string; topic?: string; input?: string }).input
      ?? JSON.stringify(parsed);
  } catch {
    return input;
  }
}
