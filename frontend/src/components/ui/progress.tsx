"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: "indigo" | "emerald" | "rose" | "amber" | "violet";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, color = "indigo", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const colors = {
      indigo: "bg-indigo-600",
      emerald: "bg-emerald-500",
      rose: "bg-rose-500",
      amber: "bg-amber-500",
      violet: "bg-violet-600",
    };

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn("h-2 w-full rounded-full bg-slate-100 overflow-hidden", className)}
        {...props}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
