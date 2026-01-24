"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";

type ChangeoverRow = {
    id: string;
    propertyId: string;
    propertyName: string;
    date?: string; // YYYY-MM-DD (defensive)
    status: "upcoming" | "today" | "completed";
};

type BookingRow = {
    id: string;
    propertyId: string;
    propertyName: string;
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
    createdAt: number;
};

type PropertyLite = {
    id: string;
    name: string;
};

type FilterKey = "all" | "upcoming" | "today" | "completed";
type ViewMode = "week" | "month";

const CHANGEOVERS_KEY = "changeoverhq.changeovers.v1";
const BOOKINGS_KEY = "changeoverhq.bookings.v1";

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

function saveChangeovers(rows: ChangeoverRow[]) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(CHANGEOVERS_KEY, JSON.stringify(rows));
    } catch {
        // ignore
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

function saveBookings(rows: BookingRow[]) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(rows));
    } catch {
        // ignore
    }
}

/**
 * Tries a few likely keys / shapes so we don't break if your Properties
 * storage evolves. If nothing matches, we simply return [] and fall back
 * to manual property name entry.
 */
function loadPropertiesLite(): PropertyLite[] {
    if (typeof window === "undefined") return [];

    const candidateKeys = [
        "changeoverhq.properties.v1",
        "changeoverhq.properties.v0",
        "changeoverhq.properties",
        "changeoverhq.workspace.properties.v1",
    ];

    for (const key of candidateKeys) {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;

        const parsed = safeParse<unknown>(raw);
        if (!Array.isArray(parsed)) continue;

        const arr = parsed as any[];

        // Try common shapes
        const lite = arr
            .map((p) => {
                const id = typeof p?.id === "string" ? p.id : typeof p?.propertyId === "string" ? p.propertyId : null;
                const name =
                    typeof p?.name === "string"
                        ? p.name
                        : typeof p?.propertyName === "string"
                            ? p.propertyName
                            : null;

                if (!id || !name) return null;
                return { id, name } as PropertyLite;
            })
            .filter(Boolean) as PropertyLite[];

        if (lite.length > 0) {
            // stable ordering
            return lite.sort((a, b) => a.name.localeCompare(b.name));
        }
    }

    return [];
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function isoFromDate(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseISOToDate(iso: unknown): Date | null {
    if (typeof iso !== "string" || iso.trim().length === 0) return null;
    const parts = iso.split("-");
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map((x) => Number(x));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    return new Date(y, m - 1, d);
}

function formatISOShort(iso: unknown) {
    const dt = parseISOToDate(iso);
    if (!dt) return "—";
    return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short" }).format(dt);
}

function formatWeekdayShort(iso: string) {
    const dt = parseISOToDate(iso);
    if (!dt) return "—";
    return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(dt);
}

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, delta: number) {
    return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function monthTitle(d: Date) {
    return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
}

function dayLabel(i: number) {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels[i] ?? "";
}

function mondayFirstIndex(jsDay: number) {
    return (jsDay + 6) % 7;
}

function startOfWeekMonday(d: Date) {
    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const idx = mondayFirstIndex(dt.getDay());
    dt.setDate(dt.getDate() - idx);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function addDays(d: Date, delta: number) {
    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    dt.setDate(dt.getDate() + delta);
    return dt;
}

function statusPillClasses(status: ChangeoverRow["status"]) {
    return [
        "inline-flex max-w-full items-center rounded-full border px-2 py-1 text-[11px] font-semibold leading-none",
        status === "completed"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100"
            : status === "today"
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100"
                : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-100",
    ].join(" ");
}

function chipBase(active: boolean) {
    return [
        "rounded-full border px-3 py-1 text-xs font-semibold transition",
        active
            ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
    ].join(" ");
}

function bookingToChangeoverStatus(checkOutISO: string, todayISO: string): ChangeoverRow["status"] {
    if (checkOutISO === todayISO) return "today";
    if (checkOutISO < todayISO) return "completed";
    return "upcoming";
}

export default function DashboardPage() {
    const [changeovers, setChangeovers] = useState<ChangeoverRow[]>([]);
    const [filter, setFilter] = useState<FilterKey>("all");
    const [q, setQ] = useState("");

    const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
    const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
    const [viewMode, setViewMode] = useState<ViewMode>("month");

    // non-blocking prompt (not persisted)
    const [stockPromptId, setStockPromptId] = useState<string | null>(null);

    // NEW: Quick add booking
    const [showAddBooking, setShowAddBooking] = useState(false);
    const [properties, setProperties] = useState<PropertyLite[]>([]);
    const [bookingPropertyId, setBookingPropertyId] = useState<string>("");
    const [bookingPropertyName, setBookingPropertyName] = useState<string>("");
    const [bookingCheckIn, setBookingCheckIn] = useState<string>("");
    const [bookingCheckOut, setBookingCheckOut] = useState<string>("");

    const [bookingBanner, setBookingBanner] = useState<null | { tone: "ok" | "warn"; text: string }>(null);

    useEffect(() => {
        const rows = loadChangeovers();
        setChangeovers(rows);

        const hasToday = rows.some((c) => c.status === "today");
        setViewMode(hasToday ? "week" : "month");

        setProperties(loadPropertiesLite());
    }, []);

    const todayISO = useMemo(() => isoFromDate(new Date()), []);

    function markCompleted(id: string) {
        setChangeovers((prev) => {
            const next = prev.map((c) => (c.id === id ? { ...c, status: "completed" as const } : c));
            saveChangeovers(next);
            return next;
        });

        setStockPromptId(id);
    }

    function resetBookingForm() {
        setBookingPropertyId("");
        setBookingPropertyName("");
        setBookingCheckIn("");
        setBookingCheckOut("");
    }

    function onSelectProperty(id: string) {
        setBookingPropertyId(id);
        const found = properties.find((p) => p.id === id);
        setBookingPropertyName(found ? found.name : "");
    }

    function addBooking() {
        setBookingBanner(null);

        const propId = bookingPropertyId.trim();
        const propName = bookingPropertyName.trim();

        if (!propName) {
            setBookingBanner({ tone: "warn", text: "Add a property name (or select a property) before saving." });
            return;
        }

        if (!bookingCheckIn || !bookingCheckOut) {
            setBookingBanner({ tone: "warn", text: "Select check-in and check-out dates." });
            return;
        }

        // Basic ISO validation
        const inDt = parseISOToDate(bookingCheckIn);
        const outDt = parseISOToDate(bookingCheckOut);
        if (!inDt || !outDt) {
            setBookingBanner({ tone: "warn", text: "Dates must be valid (YYYY-MM-DD)." });
            return;
        }
        if (bookingCheckOut < bookingCheckIn) {
            setBookingBanner({ tone: "warn", text: "Check-out can’t be before check-in." });
            return;
        }

        // If no propertyId yet (e.g. user typed manual), create a stable-ish id
        const finalPropertyId = propId || `manual-${propName.toLowerCase().replace(/\s+/g, "-")}`;

        const bookingId = `bk-${Date.now()}`;
        const newBooking: BookingRow = {
            id: bookingId,
            propertyId: finalPropertyId,
            propertyName: propName,
            checkIn: bookingCheckIn,
            checkOut: bookingCheckOut,
            createdAt: Date.now(),
        };

        const existingBookings = loadBookings();
        const nextBookings = [newBooking, ...existingBookings];
        saveBookings(nextBookings);

        // Create / upsert a changeover for the check-out date
        const newChangeoverId = `chg-${bookingId}`;
        const newChangeover: ChangeoverRow = {
            id: newChangeoverId,
            propertyId: finalPropertyId,
            propertyName: propName,
            date: bookingCheckOut,
            status: bookingToChangeoverStatus(bookingCheckOut, todayISO),
        };

        setChangeovers((prev) => {
            const withoutExisting = prev.filter((c) => c.id !== newChangeoverId);
            const next = [newChangeover, ...withoutExisting];

            // keep storage in sync
            saveChangeovers(next);
            return next;
        });

        setBookingBanner({ tone: "ok", text: "Booking saved. Changeover created from check-out date." });
        resetBookingForm();
        setShowAddBooking(false);
    }

    const todaysChangeovers = useMemo(() => {
        return changeovers
            .filter((c) => c.date === todayISO && (c.status === "today" || c.status === "upcoming"))
            .sort((a, b) => a.propertyName.localeCompare(b.propertyName));
    }, [changeovers, todayISO]);

    const filteredChangeovers = useMemo(() => {
        const query = q.trim().toLowerCase();

        let rows = changeovers;
        if (filter !== "all") rows = rows.filter((c) => c.status === filter);
        if (query) rows = rows.filter((c) => c.propertyName.toLowerCase().includes(query));

        return rows;
    }, [changeovers, filter, q]);

    const byDate = useMemo(() => {
        const map = new Map<string, ChangeoverRow[]>();

        for (const c of filteredChangeovers) {
            if (typeof c.date !== "string" || c.date.trim().length === 0) continue;
            const arr = map.get(c.date) ?? [];
            arr.push(c);
            map.set(c.date, arr);
        }

        for (const [k, arr] of map.entries()) {
            arr.sort((a, b) => a.propertyName.localeCompare(b.propertyName));
            map.set(k, arr);
        }

        return map;
    }, [filteredChangeovers]);

    const monthStart = useMemo(() => startOfMonth(viewMonth), [viewMonth]);
    const monthEnd = useMemo(() => endOfMonth(viewMonth), [viewMonth]);
    const leadingBlanks = useMemo(() => mondayFirstIndex(monthStart.getDay()), [monthStart]);
    const daysInMonth = useMemo(() => monthEnd.getDate(), [monthEnd]);

    const monthCells = useMemo(() => {
        const out: Array<{ type: "blank" } | { type: "day"; date: Date; iso: string }> = [];

        for (let i = 0; i < leadingBlanks; i++) out.push({ type: "blank" });

        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
            out.push({ type: "day", date: d, iso: isoFromDate(d) });
        }

        while (out.length % 7 !== 0) out.push({ type: "blank" });

        return out;
    }, [leadingBlanks, daysInMonth, monthStart]);

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = addDays(weekStart, i);
            return { date: d, iso: isoFromDate(d) };
        });
    }, [weekStart]);

    const weekTitle = useMemo(() => {
        const startISO = isoFromDate(weekStart);
        const endISO = isoFromDate(addDays(weekStart, 6));
        return `${formatISOShort(startISO)} → ${formatISOShort(endISO)}`;
    }, [weekStart]);

    const stats = useMemo(() => {
        let today = 0;
        let upcoming7 = 0;
        let completedToday = 0;

        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end7 = new Date(start);
        end7.setDate(end7.getDate() + 7);

        for (const c of changeovers) {
            if (c.date === todayISO && c.status === "today") today += 1;
            if (c.date === todayISO && c.status === "completed") completedToday += 1;

            const dt = parseISOToDate(c.date);
            if (!dt) continue;

            if (dt >= start && dt < end7 && c.status !== "completed") upcoming7 += 1;
        }

        return { today, upcoming7, completedToday };
    }, [changeovers, todayISO]);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Dashboard"
                subtitle="A quick operational overview with calendar visibility."
                actions={
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Link
                            href="/app/bookings"
                            className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                        >
                            Bookings
                        </Link>
                        <Link
                            href="/app/changeovers"
                            className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition text-center"
                        >
                            Changeovers
                        </Link>
                    </div>
                }
            />

            {/* QUICK ADD BOOKING */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick add booking</div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            Manually create a booking and we’ll generate the changeover from check-out.
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={() => {
                                setBookingBanner(null);
                                setShowAddBooking((v) => !v);
                            }}
                            className={[
                                "rounded-xl px-4 py-2 text-sm font-semibold transition text-center",
                                showAddBooking
                                    ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                    : "border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900",
                            ].join(" ")}
                        >
                            {showAddBooking ? "Close" : "Add booking"}
                        </button>
                    </div>
                </div>

                {bookingBanner && (
                    <div
                        className={[
                            "mt-4 rounded-2xl border p-4 text-sm shadow-sm",
                            bookingBanner.tone === "ok"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100"
                                : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100",
                        ].join(" ")}
                    >
                        {bookingBanner.text}
                    </div>
                )}

                {showAddBooking && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Property</div>

                            {properties.length > 0 ? (
                                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                                    <select
                                        value={bookingPropertyId}
                                        onChange={(e) => onSelectProperty(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                                    >
                                        <option value="">Select property…</option>
                                        {properties.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        value={bookingPropertyName}
                                        onChange={(e) => setBookingPropertyName(e.target.value)}
                                        placeholder="Or type property name…"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                                    />
                                </div>
                            ) : (
                                <input
                                    value={bookingPropertyName}
                                    onChange={(e) => setBookingPropertyName(e.target.value)}
                                    placeholder="Type property name…"
                                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                                />
                            )}

                            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                If you haven’t created properties yet, you can still type a name and keep moving.
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Check-in</div>
                            <input
                                type="date"
                                value={bookingCheckIn}
                                onChange={(e) => setBookingCheckIn(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                            />
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Check-out</div>
                            <input
                                type="date"
                                value={bookingCheckOut}
                                onChange={(e) => setBookingCheckOut(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                            />
                        </div>

                        <div className="sm:col-span-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setBookingBanner(null);
                                    resetBookingForm();
                                    setShowAddBooking(false);
                                }}
                                className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition text-center"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={addBooking}
                                className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition text-center"
                            >
                                Save booking
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* TODAY PANEL */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Today</div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{formatISOShort(todayISO)}</div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {todaysChangeovers.length === 0 ? "No changeovers today." : `${todaysChangeovers.length} changeover(s)`}
                    </div>
                </div>

                {todaysChangeovers.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {todaysChangeovers.map((c) => (
                            <div
                                key={c.id}
                                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={statusPillClasses(c.status)}>
                                                <span className="truncate">{c.status === "today" ? "Today" : "Upcoming"}</span>
                                            </span>
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                {c.propertyName}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            href={`/app/changeovers/${c.id}`}
                                            className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                        >
                                            Open
                                        </Link>
                                        <Link
                                            href={`/app/changeovers/${c.id}/checklist`}
                                            className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                        >
                                            Checklist
                                        </Link>
                                        <Link
                                            href={`/app/changeovers/${c.id}/stock-update`}
                                            className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                        >
                                            Stock update
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => markCompleted(c.id)}
                                            className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                                        >
                                            Mark completed
                                        </button>
                                    </div>
                                </div>

                                {/* Non-blocking prompt */}
                                {stockPromptId === c.id && (
                                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                            Changeover marked as completed.
                                        </div>
                                        <div className="mt-1">Update stock now?</div>

                                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                            <Link
                                                href={`/app/changeovers/${c.id}/stock-update`}
                                                className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition text-center"
                                            >
                                                Update stock
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setStockPromptId(null)}
                                                className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition text-center"
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

            {/* Quick stats */}
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">TODAY</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.today}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Changeovers labelled “Today”</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">NEXT 7 DAYS</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.upcoming7}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Not completed</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">COMPLETED TODAY</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.completedToday}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Marked completed</div>
                </div>
            </div>

            {/* Filters + search + view toggle */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setFilter("all")} className={chipBase(filter === "all")}>
                            All
                        </button>
                        <button type="button" onClick={() => setFilter("upcoming")} className={chipBase(filter === "upcoming")}>
                            Upcoming
                        </button>
                        <button type="button" onClick={() => setFilter("today")} className={chipBase(filter === "today")}>
                            Today
                        </button>
                        <button type="button" onClick={() => setFilter("completed")} className={chipBase(filter === "completed")}>
                            Completed
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={() => setViewMode("week")} className={chipBase(viewMode === "week")}>
                            Week
                        </button>
                        <button type="button" onClick={() => setViewMode("month")} className={chipBase(viewMode === "month")}>
                            Month
                        </button>
                    </div>
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
                            className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition text-center"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* WEEK VIEW */}
            {viewMode === "week" && (
                <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">This week</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{weekTitle}</div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={() => setWeekStart(addDays(weekStart, -7))}
                                className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
                                className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                            >
                                This week
                            </button>
                            <button
                                type="button"
                                onClick={() => setWeekStart(addDays(weekStart, 7))}
                                className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-7">
                            {weekDays.map((d) => {
                                const items = byDate.get(d.iso) ?? [];
                                const isToday = d.iso === todayISO;

                                return (
                                    <div
                                        key={d.iso}
                                        className={[
                                            "min-h-[140px] border-b border-slate-200/60 dark:border-slate-800/60 p-3",
                                            "sm:border-b-0 sm:border-r sm:last:border-r-0",
                                            isToday ? "bg-slate-50 dark:bg-slate-950" : "",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                {formatWeekdayShort(d.iso)}
                                            </div>
                                            <div className="text-xs text-slate-600 dark:text-slate-300">{formatISOShort(d.iso)}</div>
                                        </div>

                                        {isToday && (
                                            <div className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                                Today
                                            </div>
                                        )}

                                        <div className="mt-3 space-y-1">
                                            {items.length === 0 ? (
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400">No changeovers</div>
                                            ) : (
                                                <>
                                                    {items.slice(0, 6).map((c) => (
                                                        <Link
                                                            key={c.id}
                                                            href={`/app/changeovers/${c.id}`}
                                                            className={statusPillClasses(c.status)}
                                                            title={`${c.propertyName} (${c.status})`}
                                                        >
                                                            <span className="truncate">{c.propertyName}</span>
                                                        </Link>
                                                    ))}
                                                    {items.length > 6 && (
                                                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                                                            +{items.length - 6} more
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* MONTH VIEW */}
            {viewMode === "month" && (
                <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{monthTitle(viewMonth)}</div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                                className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMonth(startOfMonth(new Date()))}
                                className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                                className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {dayLabel(i)}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7">
                            {monthCells.map((cell, idx) => {
                                if (cell.type === "blank") {
                                    return (
                                        <div
                                            key={`blank-${idx}`}
                                            className="min-h-[110px] border-b border-slate-200/60 border-r border-slate-200/60 dark:border-slate-800/60"
                                        />
                                    );
                                }

                                const isToday = cell.iso === todayISO;
                                const items = byDate.get(cell.iso) ?? [];

                                return (
                                    <div
                                        key={cell.iso}
                                        className={[
                                            "min-h-[110px] border-b border-r border-slate-200/60 dark:border-slate-800/60 p-2",
                                            isToday ? "bg-slate-50 dark:bg-slate-950" : "",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div
                                                className={[
                                                    "text-xs font-semibold",
                                                    isToday
                                                        ? "text-slate-900 dark:text-slate-100"
                                                        : "text-slate-700 dark:text-slate-200",
                                                ].join(" ")}
                                            >
                                                {cell.date.getDate()}
                                            </div>

                                            {isToday && (
                                                <div className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                                    Today
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-2 space-y-1">
                                            {items.slice(0, 3).map((c) => (
                                                <Link
                                                    key={c.id}
                                                    href={`/app/changeovers/${c.id}`}
                                                    className={statusPillClasses(c.status)}
                                                    title={`${c.propertyName} (${c.status})`}
                                                >
                                                    <span className="truncate">{c.propertyName}</span>
                                                </Link>
                                            ))}

                                            {items.length > 3 && (
                                                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                                                    +{items.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {changeovers.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                    No changeovers found yet. Go to{" "}
                    <Link href="/app/bookings" className="font-semibold underline">
                        Bookings
                    </Link>{" "}
                    and generate changeovers.
                </div>
            )}
        </div>
    );
}
