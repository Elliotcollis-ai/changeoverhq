"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { SectionHeader } from "@/components/section-header";

type ChangeoverRow = {
    id: string;
    propertyId: string;
    propertyName: string;
    date: string; // YYYY-MM-DD
    status: "upcoming" | "today" | "completed";
};

type FilterKey = "all" | "upcoming" | "today" | "completed";

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

function compareISO(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

function formatISODate(iso: string): string {
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
    }).format(dt);
}

function statusLabel(s: ChangeoverRow["status"]) {
    return s === "completed" ? "Completed" : s === "today" ? "Today" : "Upcoming";
}

function statusPillClasses(s: ChangeoverRow["status"]) {
    return [
        "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
        s === "completed"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100"
            : s === "today"
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100"
                : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-100",
    ].join(" ");
}

export default function ChangeoversPage() {
    const [changeovers, setChangeovers] = useState<ChangeoverRow[]>([]);
    const [filter, setFilter] = useState<FilterKey>("all");
    const [q, setQ] = useState("");

    const didAutoDefault = useRef(false);

    useEffect(() => {
        setChangeovers(loadChangeovers());
    }, []);

    const sorted = useMemo(() => {
        return [...changeovers].sort((a, b) => compareISO(a.date, b.date));
    }, [changeovers]);

    const counts = useMemo(() => {
        const c = { all: sorted.length, upcoming: 0, today: 0, completed: 0 };
        for (const row of sorted) c[row.status] += 1;
        return c;
    }, [sorted]);

    // Intelligent default filter (runs once after we have data)
    useEffect(() => {
        if (didAutoDefault.current) return;
        if (sorted.length === 0) return;

        if (counts.today > 0) {
            setFilter("today");
        } else if (counts.upcoming > 0) {
            setFilter("upcoming");
        } else {
            setFilter("all");
        }

        didAutoDefault.current = true;
    }, [sorted.length, counts.today, counts.upcoming]);

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();

        let rows = sorted;

        if (filter !== "all") {
            rows = rows.filter((c) => c.status === filter);
        }

        if (query.length > 0) {
            rows = rows.filter((c) => c.propertyName.toLowerCase().includes(query));
        }

        return rows;
    }, [sorted, filter, q]);

    function chipBase(active: boolean) {
        return [
            "rounded-full border px-3 py-1 text-xs font-semibold transition",
            active
                ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
        ].join(" ");
    }

    const hasAny = sorted.length > 0;
    const hasMatches = filtered.length > 0;

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Changeovers"
                subtitle="Operational list generated from bookings. Filter and search to find what you need."
                actions={
                    <Link
                        href="/app/bookings"
                        className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                    >
                        Back to bookings
                    </Link>
                }
            />

            {/* Filters + search */}
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setFilter("all")} className={chipBase(filter === "all")}>
                        All ({counts.all})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("upcoming")}
                        className={chipBase(filter === "upcoming")}
                    >
                        Upcoming ({counts.upcoming})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("today")}
                        className={chipBase(filter === "today")}
                    >
                        Today ({counts.today})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("completed")}
                        className={chipBase(filter === "completed")}
                    >
                        Completed ({counts.completed})
                    </button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by property name…"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                    />

                    {q.trim().length > 0 && (
                        <button
                            type="button"
                            onClick={() => setQ("")}
                            className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {!hasAny ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        No changeovers yet
                    </div>
                    <div className="mt-2">
                        Go to Bookings and click <span className="font-semibold">Generate changeovers</span>.
                    </div>
                    <div className="mt-4">
                        <Link
                            href="/app/bookings"
                            className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                        >
                            Go to bookings
                        </Link>
                    </div>
                </div>
            ) : !hasMatches ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        No matches
                    </div>
                    <div className="mt-2">Try a different status, or clear your search.</div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((c) => (
                        <Link
                            key={c.id}
                            href={`/app/changeovers/${c.id}`}
                            className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {c.propertyName}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                        Changeover • {formatISODate(c.date)}
                                    </div>
                                </div>

                                <div className={statusPillClasses(c.status)}>{statusLabel(c.status)}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
