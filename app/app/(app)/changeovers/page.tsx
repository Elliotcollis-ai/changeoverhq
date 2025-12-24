"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";

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

function compareISO(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

function formatISODate(iso: string): string {
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "2-digit", month: "short" }).format(dt);
}

export default function ChangeoversPage() {
    const [changeovers, setChangeovers] = useState<ChangeoverRow[]>([]);

    useEffect(() => {
        setChangeovers(loadChangeovers());
    }, []);

    const sorted = useMemo(() => {
        return [...changeovers].sort((a, b) => compareISO(a.date, b.date));
    }, [changeovers]);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Changeovers"
                subtitle="Operational list generated from bookings. Open one to view the detail page."
                actions={
                    <Link
                        href="/app/bookings"
                        className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                    >
                        Back to bookings
                    </Link>
                }
            />

            {sorted.length === 0 ? (
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
            ) : (
                <div className="space-y-3">
                    {sorted.map((c) => (
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

                                <div
                                    className={[
                                        "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                                        c.status === "completed"
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100"
                                            : c.status === "today"
                                                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100"
                                                : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-100",
                                    ].join(" ")}
                                >
                                    {c.status === "completed" ? "Completed" : c.status === "today" ? "Today" : "Upcoming"}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
