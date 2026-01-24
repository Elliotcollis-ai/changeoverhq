"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ChangeoverRow = {
    id: string;
    propertyId: string;
    propertyName: string;
    date: string; // YYYY-MM-DD
    status: "upcoming" | "today" | "completed";
};

const CHANGEOVERS_KEY = "changeoverhq.changeovers.v1";

function safeParse<T>(raw: string): T | null {
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function loadChangeovers(): ChangeoverRow[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(CHANGEOVERS_KEY);
    if (!raw) return [];
    const parsed = safeParse<unknown>(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChangeoverRow[];
}

function saveChangeovers(rows: ChangeoverRow[]): boolean {
    if (typeof window === "undefined") return false;
    try {
        window.localStorage.setItem(CHANGEOVERS_KEY, JSON.stringify(rows));
        return true;
    } catch {
        return false;
    }
}

function todayISO(): string {
    const d = new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatISODate(iso: string): string {
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "2-digit", month: "short" }).format(dt);
}

export default function DashboardPage() {
    const [changeovers, setChangeovers] = useState<ChangeoverRow[]>([]);
    const [promptForId, setPromptForId] = useState<string | null>(null);

    useEffect(() => {
        setChangeovers(loadChangeovers());
    }, []);

    const today = todayISO();

    const todaysChangeovers = useMemo(() => {
        return changeovers.filter((c) => c.date === today);
    }, [changeovers, today]);

    function markCompleted(id: string) {
        setChangeovers((prev) => {
            const next = prev.map((c) => (c.id === id ? { ...c, status: "completed" } : c));
            saveChangeovers(next);
            return next;
        });
        setPromptForId(id);
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
                Desktop sidebar is working.
            </p>

            <div className="mt-6 space-y-4">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Today</div>

                {todaysChangeovers.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                        No changeovers scheduled for today.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todaysChangeovers.map((changeover) => (
                            <div
                                key={changeover.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                            {changeover.propertyName}
                                        </div>
                                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Changeover • {formatISODate(changeover.date)}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={[
                                                "rounded-full border px-3 py-1 text-xs font-semibold",
                                                changeover.status === "completed"
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100"
                                                    : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100",
                                            ].join(" ")}
                                        >
                                            {changeover.status === "completed" ? "Completed" : "Today"}
                                        </span>
                                        {changeover.status !== "completed" && (
                                            <button
                                                type="button"
                                                onClick={() => markCompleted(changeover.id)}
                                                className="rounded-xl px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                                            >
                                                Mark completed
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {promptForId === changeover.id && (
                                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100">
                                        <div>Changeover marked as completed. Update stock now?</div>
                                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                            <Link
                                                href={`/app/changeovers/${changeover.id}/stock-update`}
                                                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                                            >
                                                Update stock
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setPromptForId(null)}
                                                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
