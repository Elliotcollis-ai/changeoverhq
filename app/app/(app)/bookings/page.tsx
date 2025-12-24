"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";

type BookingRow = {
    id: string;
    propertyId: string;
    propertyName: string;
    guestName: string;
    checkInDate: string; // YYYY-MM-DD
    checkOutDate: string; // YYYY-MM-DD
    channel?: string;
};

type ChangeoverRow = {
    id: string;
    propertyId: string;
    propertyName: string;
    date: string; // YYYY-MM-DD (changeover date = checkout date)
    status: "upcoming" | "today" | "completed";
};

const BOOKINGS_KEY = "changeoverhq.bookings.v1";
const CHANGEOVERS_KEY = "changeoverhq.changeovers.v1";

function safeParse<T>(raw: string): T | null {
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function loadBookings(): BookingRow[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(BOOKINGS_KEY);
    if (!raw) return [];
    const parsed = safeParse<unknown>(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as BookingRow[];
}

function saveBookings(rows: BookingRow[]): boolean {
    if (typeof window === "undefined") return false;
    try {
        window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(rows));
        return true;
    } catch {
        return false;
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

function compareISO(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

function formatISODate(iso: string): string {
    // iso = YYYY-MM-DD
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "2-digit", month: "short" }).format(dt);
}

function shortId(): string {
    return Math.random().toString(36).slice(2, 8);
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<BookingRow[]>([]);
    const [banner, setBanner] = useState<null | { tone: "ok" | "warn"; text: string }>(null);

    useEffect(() => {
        setBookings(loadBookings());
    }, []);

    const sorted = useMemo(() => {
        return [...bookings].sort((a, b) => compareISO(a.checkInDate, b.checkInDate));
    }, [bookings]);

    function seedDemoBookings() {
        // Uses existing properties if you have them; otherwise uses placeholder property ids.
        const demo: BookingRow[] = [
            {
                id: `bk-${shortId()}`,
                propertyId: "rose-cottage-aaaaaa",
                propertyName: "Rose Cottage",
                guestName: "Jamie S.",
                checkInDate: "2026-01-05",
                checkOutDate: "2026-01-08",
                channel: "Booking.com",
            },
            {
                id: `bk-${shortId()}`,
                propertyId: "rose-cottage-aaaaaa",
                propertyName: "Rose Cottage",
                guestName: "Alex P.",
                checkInDate: "2026-01-10",
                checkOutDate: "2026-01-14",
                channel: "Airbnb",
            },
            {
                id: `bk-${shortId()}`,
                propertyId: "seaview-apartment-bbbbbb",
                propertyName: "Seaview Apartment",
                guestName: "Taylor R.",
                checkInDate: "2026-01-07",
                checkOutDate: "2026-01-09",
                channel: "Direct",
            },
        ];

        const ok = saveBookings(demo);
        if (!ok) {
            setBanner({ tone: "warn", text: "Could not seed bookings. Check browser storage." });
            return;
        }

        setBookings(demo);
        setBanner({ tone: "ok", text: "Seeded demo bookings." });
    }

    function generateChangeovers() {
        if (bookings.length === 0) {
            setBanner({ tone: "warn", text: "No bookings to generate changeovers from." });
            return;
        }

        const today = todayISO();

        const existing = loadChangeovers();
        const existingKey = new Set(existing.map((c) => `${c.propertyId}:${c.date}`));

        const generated: ChangeoverRow[] = [];

        for (const b of bookings) {
            const date = b.checkOutDate; // simple MVP rule: changeover on checkout date
            const key = `${b.propertyId}:${date}`;
            if (existingKey.has(key)) continue;

            const status: ChangeoverRow["status"] =
                date === today ? "today" : date < today ? "completed" : "upcoming";

            generated.push({
                id: `ch-${b.propertyId}-${date}-${shortId()}`,
                propertyId: b.propertyId,
                propertyName: b.propertyName,
                date,
                status,
            });
        }

        if (generated.length === 0) {
            setBanner({ tone: "warn", text: "No new changeovers generated (already up to date)." });
            return;
        }

        const next = [...existing, ...generated].sort((a, b) => compareISO(a.date, b.date));
        const ok = saveChangeovers(next);

        if (!ok) {
            setBanner({ tone: "warn", text: "Could not save generated changeovers. Check browser storage." });
            return;
        }

        setBanner({ tone: "ok", text: `Generated ${generated.length} changeover(s).` });
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Bookings"
                subtitle="Bookings are the source of truth. Next: generate operational changeovers."
                actions={
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={generateChangeovers}
                            className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition text-center"
                        >
                            Generate changeovers
                        </button>

                        <Link
                            href="/app/changeovers"
                            className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                        >
                            View changeovers
                        </Link>
                    </div>
                }
            />

            {banner && (
                <div
                    className={[
                        "rounded-2xl border p-4 text-sm shadow-sm",
                        banner.tone === "ok"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100"
                            : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100",
                    ].join(" ")}
                >
                    {banner.text}
                </div>
            )}

            {sorted.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        No bookings yet
                    </div>
                    <div className="mt-2">
                        For now, seed demo bookings so we can test the changeover workflow.
                    </div>
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={seedDemoBookings}
                            className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                        >
                            Seed demo bookings
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {sorted.map((b) => (
                        <div
                            key={b.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {b.propertyName}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                        Guest: <span className="font-semibold">{b.guestName}</span>
                                        {b.channel ? <span> • {b.channel}</span> : null}
                                    </div>
                                    <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                        {formatISODate(b.checkInDate)} → {formatISODate(b.checkOutDate)}
                                    </div>
                                </div>

                                <div className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                                    Booking
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="text-xs text-slate-600 dark:text-slate-300">
                MVP rule: each booking generates a changeover on the booking’s check-out date.
            </div>
        </div>
    );
}
