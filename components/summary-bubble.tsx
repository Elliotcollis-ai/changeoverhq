"use client";

import { ChevronDown } from "lucide-react";

export function SummaryBubble({
    label,
    summary,
    isExpanded,
    onClick,
    tone = "default",
}: {
    label: string;
    summary: string;
    isExpanded: boolean;
    onClick: () => void;
    tone?: "default" | "primary";
}) {
    const base =
        "w-full rounded-2xl border bg-white p-4 text-left transition hover:shadow-sm dark:bg-slate-900";
    const border = isExpanded
        ? "border-slate-300 dark:border-slate-600"
        : "border-slate-200 dark:border-slate-800";
    const ring =
        tone === "primary" && isExpanded
            ? "ring-1 ring-slate-300 dark:ring-slate-600"
            : "";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`${base} ${border} ${ring}`}
            aria-expanded={isExpanded}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                        {label.toUpperCase()}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {summary}
                    </div>
                </div>

                <ChevronDown
                    size={18}
                    className={`mt-0.5 shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${isExpanded ? "rotate-180" : ""
                        }`}
                />
            </div>
        </button>
    );
}
