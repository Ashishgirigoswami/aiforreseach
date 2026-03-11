"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

const Select = ({ value, onValueChange, children, placeholder, className }: SelectProps) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && (child.props as SelectItemProps).value === value
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      >
        <span className={!value ? "text-slate-400" : ""}>
          {value
            ? React.isValidElement(selectedLabel)
              ? (selectedLabel.props as SelectItemProps).children
              : value
            : placeholder || "Select..."}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;
            const childProps = child.props as SelectItemProps;
            return React.cloneElement(child as React.ReactElement<SelectItemProps>, {
              onSelect: (val: string) => {
                onValueChange?.(val);
                setOpen(false);
              },
              selected: childProps.value === value,
            });
          })}
        </div>
      )}
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
  selected?: boolean;
  className?: string;
}

const SelectItem = ({ value, children, onSelect, selected, className }: SelectItemProps) => (
  <div
    onClick={() => onSelect?.(value)}
    className={cn(
      "px-3 py-2 text-sm cursor-pointer transition-colors",
      selected ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-700 hover:bg-slate-50",
      className
    )}
  >
    {children}
  </div>
);

export { Select, SelectItem };
