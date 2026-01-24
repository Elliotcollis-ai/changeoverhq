"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";

type ChangeoverRow = {
    id: string;
    propertyId: string;
    propertyName: string;
    date?: string; // YYYY-MM-DD
    status: "upcoming" | "today" | "completed";
};

type StockLocation = {
    id: string;
    name: string;
    isActive: boolean;
};

type StockLocationsState = {
    locations: StockLocation[];
    defaultLocationId: string | null;
};

type PropertyConfig = {
    stockLocationId?: string | null;
    beds: { type: string; count: number }[];
    welcomePack: { id: string; name: string; qty: number; enabled: boolean }[];
    cleaningBundle: { id: string; name: string; qty: number; enabled: boolean }[];
};

type WindowKey = "3" | "7" | "14";

type LocationShopping = {
    locationId: string;
    locationName: string;
    rows: Array<{ name: string; qty: number }>;
};

const CHANGEOVERS_KEY = "changeoverhq.changeovers.v1";
const STOCK_LOCATIONS_KEY = "changeoverhq.stockLocations.v1";
const TICKS_KEY_PREFIX = "changeoverhq.shoppingTicks.v2."; // bump version because grouping changes keys

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

function loadStockLocations(): StockLocationsState {
    if (typeof window === "undefined") return { locations: [], defaultLocationId: null };
    const raw = window.localStorage.getItem(STOCK_LOCATIONS_KEY);
    if (!raw) return { locations: [], defaultLocationId: null };

    const parsed = safeParse<unknown>(raw);
    if (!parsed || typeof parsed !== "object") return { locations: [], defaultLocationId: null };

    const obj = parsed as Partial<StockLocationsState>;
    const locations = Array.isArray(obj.locations) ? (obj.locations as StockLocation[]) : [];
    const defaultLocationId = typeof obj.defaultLocationId === "string" ? obj.defaultLocationId : null;

    const cleaned = locations
        .filter((l) => l && typeof l.id === "string" && typeof l.name === "string")
        .map((l) => ({
            id: l.id,
            name: l.name.trim() || "Untitled location",
            isActive: typeof l.isActive === "boolean" ? l.isActive : true,
        }));

    const defaultStillExists = defaultLocationId && cleaned.some((l) => l.id === defaultLocationId);

    return {
        locations: cleaned,
        defaultLocationId: defaultStillExists ? defaultLocationId : (cleaned[0]?.id ?? null),
    };
}

function loadPropertyConfig(propertyId: string): PropertyConfig | null {
    if (typeof window === "undefined") return null;
    const key = `changeoverhq.property.${propertyId}.config.v1`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = safeParse<unknown>(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const obj = parsed as Partial<PropertyConfig>;
    if (!Array.isArray(obj.beds) || !Array.isArray(obj.welcomePack) || !Array.isArray(obj.cleaningBundle)) return null;

    return {
        stockLocationId: typeof obj.stockLocationId === "string" ? obj.stockLocationId : (obj.stockLocationId ?? null),
        beds: obj.beds as PropertyConfig["beds"],
        welcomePack: obj.welcomePack as PropertyConfig["welcomePack"],
        cleaningBundle: obj.cleaningBundle as PropertyConfig["cleaningBundle"],
    };
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
    return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "2-digit", month: "short" }).format(dt);
}

function chipBase(active: boolean) {
    return [
        "rounded-full border px-3 py-1 text-xs font-semibold transition",
        active
            ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
    ].join(" ");
}

function normalizeKey(name: string) {
    return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function loadTicks(key: string): Record<string, boolean> {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = safeParse<Record<string, boolean>>(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
}

function saveTicks(key: string, ticks: Record<string, boolean>) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(ticks));
    } catch {
        // ignore
    }
}

export default function SuppliesShoppingListPage() {
    const [changeovers, setChangeovers] = useState<ChangeoverRow[]>([]);
    const [stockLocations, setStockLocations] = useState<StockLocationsState>({ locations: [], defaultLocationId: null });
    const [windowDays, setWindowDays] = useState<WindowKey>("7");

    const [tickMode, setTickMode] = useState(false);
    const [ticks, setTicks] = useState<Record<string, boolean>>({});

    const [printView, setPrintView] = useState(false);
    const [printShowChangeovers, setPrintShowChangeovers] = useState(true);

    useEffect(() => {
        setChangeovers(loadChangeovers());
        setStockLocations(loadStockLocations());
    }, []);

    const todayISO = useMemo(() => isoFromDate(new Date()), []);

    const windowEndISO = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + Number(windowDays));
        return isoFromDate(end);
    }, [windowDays]);

    const ticksKey = useMemo(() => `${TICKS_KEY_PREFIX}${windowDays}`, [windowDays]);

    useEffect(() => {
        setTicks(loadTicks(ticksKey));
    }, [ticksKey]);

    useEffect(() => {
        saveTicks(ticksKey, ticks);
    }, [ticksKey, ticks]);

    const relevant = useMemo(() => {
        return changeovers
            .filter((c) => c.status !== "completed")
            .filter((c) => typeof c.date === "string" && c.date.length > 0)
            .filter((c) => {
                const iso = c.date as string;
                return iso >= todayISO && iso < windowEndISO;
            })
            .sort((a, b) => {
                const da = (a.date ?? "") as string;
                const db = (b.date ?? "") as string;
                if (da < db) return -1;
                if (da > db) return 1;
                return a.propertyName.localeCompare(b.propertyName);
            });
    }, [changeovers, todayISO, windowEndISO]);

    const shoppingByLocation = useMemo(() => {
        // locationId -> itemKey -> {name, qty}
        const totalsByLoc = new Map<string, Map<string, { name: string; qty: number }>>();
        const missingConfigs: Array<{ propertyId: string; propertyName: string }> = [];

        const activeLocations = stockLocations.locations.filter((l) => l.isActive);

        function resolveLocationId(cfg: PropertyConfig | null): string {
            if (cfg?.stockLocationId && cfg.stockLocationId.trim().length > 0) return cfg.stockLocationId;

            if (stockLocations.defaultLocationId) return stockLocations.defaultLocationId;

            const firstActive = activeLocations[0];
            if (firstActive) return firstActive.id;

            return "unassigned";
        }

        function ensureLoc(locationId: string) {
            const existing = totalsByLoc.get(locationId);
            if (existing) return existing;
            const created = new Map<string, { name: string; qty: number }>();
            totalsByLoc.set(locationId, created);
            return created;
        }

        for (const c of relevant) {
            const cfg = loadPropertyConfig(c.propertyId);
            if (!cfg) {
                if (!missingConfigs.find((x) => x.propertyId === c.propertyId)) {
                    missingConfigs.push({ propertyId: c.propertyId, propertyName: c.propertyName });
                }
                continue;
            }

            const locId = resolveLocationId(cfg);
            const bucket = ensureLoc(locId);

            const welcome = (cfg.welcomePack ?? []).filter((i) => i.enabled);
            const cleaning = (cfg.cleaningBundle ?? []).filter((i) => i.enabled);

            for (const item of [...welcome, ...cleaning]) {
                const cleanName = item.name.trim();
                if (!cleanName) continue;

                const qty = Number.isFinite(item.qty) ? item.qty : 1;
                const key = normalizeKey(cleanName);

                const existing = bucket.get(key);
                if (existing) {
                    existing.qty += qty;
                    bucket.set(key, existing);
                } else {
                    bucket.set(key, { name: cleanName, qty });
                }
            }
        }

        function locationNameFor(id: string) {
            if (id === "unassigned") return "Unassigned";
            const found = stockLocations.locations.find((l) => l.id === id);
            if (!found) return "Unknown location";
            return found.name + (found.isActive ? "" : " (inactive)");
        }

        const groups: LocationShopping[] = Array.from(totalsByLoc.entries()).map(([locationId, bucket]) => {
            const rows = Array.from(bucket.values()).sort((a, b) => a.name.localeCompare(b.name));
            return { locationId, locationName: locationNameFor(locationId), rows };
        });

        const def = stockLocations.defaultLocationId;
        groups.sort((a, b) => {
            const aDef = def && a.locationId === def ? 0 : 1;
            const bDef = def && b.locationId === def ? 0 : 1;
            if (aDef !== bDef) return aDef - bDef;
            return a.locationName.localeCompare(b.locationName);
        });

        const totalRows = groups.reduce((sum, g) => sum + g.rows.length, 0);

        return { groups, missingConfigs, totalRows };
    }, [relevant, stockLocations.defaultLocationId, stockLocations.locations]);

    const progress = useMemo(() => {
        const allKeys: string[] = [];
        for (const g of shoppingByLocation.groups) {
            for (const r of g.rows) {
                allKeys.push(`${g.locationId}::${normalizeKey(r.name)}`);
            }
        }
        const total = allKeys.length;
        if (total === 0) return { total: 0, done: 0 };

        const done = allKeys.reduce((acc, k) => acc + (ticks[k] ? 1 : 0), 0);
        return { total, done };
    }, [shoppingByLocation.groups, ticks]);

    function toggleTick(locationId: string, name: string) {
        const key = `${locationId}::${normalizeKey(name)}`;
        setTicks((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function clearTicks() {
        setTicks({});
    }

    function markAll() {
        const next: Record<string, boolean> = {};
        for (const g of shoppingByLocation.groups) {
            for (const row of g.rows) {
                const key = `${g.locationId}::${normalizeKey(row.name)}`;
                next[key] = true;
            }
        }
        setTicks(next);
    }

    function listItemClasses(done: boolean) {
        return [
            "flex items-center justify-between py-3 select-none",
            tickMode ? "cursor-pointer" : "",
            done ? "opacity-60" : "",
        ].join(" ");
    }

    // PRINT MODE: simple one-screen layout + window.print()
    function triggerPrint() {
        setPrintView(true);
        setTimeout(() => {
            window.print();
        }, 50);
    }

    function printTitle() {
        return `Shopping list • Next ${windowDays} days`;
    }

    const totalGroups = shoppingByLocation.groups.length;

    if (printView) {
        return (
            <div className="p-6">
                <div className="mx-auto max-w-3xl space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{printTitle()}</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {formatISOShort(todayISO)} → {formatISOShort(windowEndISO)}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Grouped by stock location
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 print:hidden">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition text-center"
                            >
                                Print
                            </button>
                            <button
                                type="button"
                                onClick={() => setPrintView(false)}
                                className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition text-center"
                            >
                                Back
                            </button>
                        </div>
                    </div>

                    <div className="print:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <label className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Show included changeovers
                            </span>
                            <input
                                type="checkbox"
                                checked={printShowChangeovers}
                                onChange={(e) => setPrintShowChangeovers(e.target.checked)}
                                className="h-5 w-5"
                            />
                        </label>
                    </div>

                    {printShowChangeovers && relevant.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Included changeovers</div>
                            <ul className="mt-3 space-y-2 text-sm text-slate-800 dark:text-slate-200">
                                {relevant.map((c) => (
                                    <li key={c.id} className="flex items-center justify-between gap-3">
                                        <span className="font-semibold">{c.propertyName}</span>
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {formatISOShort(c.date)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {shoppingByLocation.totalRows === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="text-sm text-slate-700 dark:text-slate-200">Nothing to buy.</div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {shoppingByLocation.groups.map((g) => (
                                <div
                                    key={g.locationId}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {g.locationName}
                                    </div>

                                    <ul className="mt-4 space-y-3">
                                        {g.rows.map((row) => (
                                            <li
                                                key={`${g.locationId}::${row.name}`}
                                                className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 last:border-b-0 dark:border-slate-800"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-5 w-5 rounded-md border border-slate-400" />
                                                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                        {row.name}
                                                    </div>
                                                </div>
                                                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                                    × {row.qty}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {shoppingByLocation.missingConfigs.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                            <div className="font-semibold">Note</div>
                            <div className="mt-1">Some properties aren’t set up yet, so their items are excluded.</div>
                        </div>
                    )}

                    <div className="text-xs text-slate-500 dark:text-slate-400 print:mt-8">
                        Generated by ChangeoverHQ
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Supplies"
                subtitle={`Shopping list grouped by stock location • ${relevant.length} changeover(s) in range • ${totalGroups} location(s)`}
                actions={
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Link
                            href="/app/changeovers"
                            className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                        >
                            Back to changeovers
                        </Link>

                        <button
                            type="button"
                            onClick={() => setTickMode((v) => !v)}
                            className={[
                                "rounded-xl px-4 py-2 text-sm font-semibold transition text-center",
                                tickMode
                                    ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                    : "border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800",
                            ].join(" ")}
                        >
                            {tickMode ? "Tick-off mode: ON" : "Tick-off mode"}
                        </button>

                        <button
                            type="button"
                            onClick={triggerPrint}
                            className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                        >
                            Print view
                        </button>
                    </div>
                }
            />

            {/* Window selector */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Window</div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            Includes changeovers from <span className="font-semibold">{formatISOShort(todayISO)}</span> up
                            to <span className="font-semibold">{formatISOShort(windowEndISO)}</span>.
                        </div>
                    </div>

                    {tickMode && (
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {progress.done}/{progress.total} done
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setWindowDays("3")} className={chipBase(windowDays === "3")}>
                        Next 3 days
                    </button>
                    <button type="button" onClick={() => setWindowDays("7")} className={chipBase(windowDays === "7")}>
                        Next 7 days
                    </button>
                    <button type="button" onClick={() => setWindowDays("14")} className={chipBase(windowDays === "14")}>
                        Next 14 days
                    </button>

                    <Link href="/app/stock-locations" className={chipBase(false)}>
                        Manage stock locations
                    </Link>
                </div>

                {tickMode && shoppingByLocation.totalRows > 0 && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={markAll}
                            className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition text-center"
                        >
                            Mark all
                        </button>
                        <button
                            type="button"
                            onClick={clearTicks}
                            className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition text-center"
                        >
                            Clear ticks
                        </button>
                    </div>
                )}
            </div>

            {/* Missing setup warning */}
            {shoppingByLocation.missingConfigs.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                    <div className="font-semibold">Some properties aren’t set up yet</div>
                    <div className="mt-1">These properties don’t have saved templates, so their items are excluded:</div>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                        {shoppingByLocation.missingConfigs.map((p) => (
                            <li key={p.propertyId}>
                                <Link href={`/app/properties/${p.propertyId}`} className="font-semibold underline">
                                    {p.propertyName}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Included changeovers */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Included changeovers</div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {relevant.length === 0 ? "None in this window." : `${relevant.length} changeover(s) in range.`}
                        </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Tap one to open</div>
                </div>

                {relevant.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {relevant.map((c) => (
                            <Link
                                key={c.id}
                                href={`/app/changeovers/${c.id}`}
                                className="block rounded-xl border border-slate-200 bg-white p-3 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {c.propertyName}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                            {formatISOShort(c.date)}
                                        </div>
                                    </div>
                                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                        {c.status === "today" ? "Today" : c.status === "upcoming" ? "Upcoming" : "Completed"}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Shopping list by location */}
            {shoppingByLocation.totalRows === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    Nothing to buy in this window (or templates aren’t set up).
                </div>
            ) : (
                <div className="space-y-4">
                    {shoppingByLocation.groups.map((group) => (
                        <div
                            key={group.locationId}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {group.locationName}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                        {group.rows.length} line(s)
                                    </div>
                                </div>

                                {tickMode && group.rows.length > 0 && (
                                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                        {group.rows.reduce((acc, r) => acc + (ticks[`${group.locationId}::${normalizeKey(r.name)}`] ? 1 : 0), 0)}/{group.rows.length}
                                    </div>
                                )}
                            </div>

                            <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                                {group.rows.map((row) => {
                                    const tickKey = `${group.locationId}::${normalizeKey(row.name)}`;
                                    const done = !!ticks[tickKey];

                                    return (
                                        <li
                                            key={tickKey}
                                            className={listItemClasses(done)}
                                            onClick={tickMode ? () => toggleTick(group.locationId, row.name) : undefined}
                                            role={tickMode ? "button" : undefined}
                                            tabIndex={tickMode ? 0 : -1}
                                            onKeyDown={
                                                tickMode
                                                    ? (e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            toggleTick(group.locationId, row.name);
                                                        }
                                                    }
                                                    : undefined
                                            }
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {tickMode && (
                                                    <div
                                                        className={[
                                                            "h-5 w-5 rounded-md border flex items-center justify-center text-[12px] font-bold",
                                                            done
                                                                ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100"
                                                                : "border-slate-300 bg-white text-transparent dark:border-slate-700 dark:bg-slate-950",
                                                        ].join(" ")}
                                                        aria-hidden="true"
                                                    >
                                                        ✓
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <div
                                                        className={[
                                                            "text-sm text-slate-900 dark:text-slate-100 truncate",
                                                            done ? "line-through" : "",
                                                        ].join(" ")}
                                                    >
                                                        {row.name}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                × {row.qty}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Next upgrade (future)</div>
                <div className="mt-1">
                    Add optional inventory subtraction: shopping list = required minus on-hand (per stock location).
                </div>
            </div>
        </div>
    );
}
