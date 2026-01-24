"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";

type ChangeoverRow = {
    id: string;
    propertyId: string;
    propertyName: string;
    date?: string; // YYYY-MM-DD
    status?: "upcoming" | "today" | "completed";
};

type TemplateItem = {
    id: string;
    name: string;
    qty: number;
    enabled: boolean;
    isCustom?: boolean;
};

type BedRow = {
    type: string;
    count: number;
};

type PropertyConfig = {
    stockLocationId?: string | null;
    beds: BedRow[];
    welcomePack: TemplateItem[];
    cleaningBundle: TemplateItem[];
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

type ListLine = {
    itemKey: string; // normalized key for grouping
    name: string;
    qty: number;
    sources: Array<{ propertyName: string; changeoverId: string; qty: number }>;
};

type LocationGroup = {
    locationId: string;
    locationName: string;
    lines: ListLine[];
};

const CHANGEOVERS_KEY = "changeoverhq.changeovers.v1";
const STOCK_LOCATIONS_KEY = "changeoverhq.stockLocations.v1";

function safeParse<T>(raw: string): T | null {
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function parseISOToDate(iso: unknown): Date | null {
    if (typeof iso !== "string" || iso.trim().length === 0) return null;
    const parts = iso.split("-");
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map((x) => Number(x));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    return new Date(y, m - 1, d);
}

function isoFromDate(d: Date) {
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function addDays(d: Date, delta: number) {
    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    dt.setDate(dt.getDate() + delta);
    return dt;
}

function formatISOShort(iso: unknown) {
    const dt = parseISOToDate(iso);
    if (!dt) return "—";
    return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short" }).format(dt);
}

function normalizeKey(name: string) {
    return name.trim().toLowerCase().replace(/\s+/g, " ");
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
        beds: obj.beds as BedRow[],
        welcomePack: obj.welcomePack as TemplateItem[],
        cleaningBundle: obj.cleaningBundle as TemplateItem[],
    };
}

function button(kind: "primary" | "secondary") {
    const base = "rounded-xl px-4 py-2 text-sm font-semibold transition text-center";
    if (kind === "primary") {
        return [
            base,
            "bg-slate-900 text-white hover:bg-slate-800",
            "dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
        ].join(" ");
    }
    return [
        base,
        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        "dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
    ].join(" ");
}

function input() {
    return [
        "w-full rounded-xl border px-3 py-2 text-sm outline-none",
        "border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-slate-200",
        "dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700",
    ].join(" ");
}

export default function ShoppingListPage() {
    const [days, setDays] = useState<number>(7);
    const [includeWelcome, setIncludeWelcome] = useState(true);
    const [includeCleaning, setIncludeCleaning] = useState(true);
    const [showBreakdown, setShowBreakdown] = useState(false);

    const [changeovers, setChangeovers] = useState<ChangeoverRow[]>([]);
    const [stockLocations, setStockLocations] = useState<StockLocationsState>({ locations: [], defaultLocationId: null });

    useEffect(() => {
        setChangeovers(loadChangeovers());
        setStockLocations(loadStockLocations());
    }, []);

    const range = useMemo(() => {
        const start = new Date();
        const startISO = isoFromDate(start);
        const endISO = isoFromDate(addDays(start, Math.max(0, Number.isFinite(days) ? days : 0)));
        return { startISO, endISO };
    }, [days]);

    const activeLocations = useMemo(() => stockLocations.locations.filter((l) => l.isActive), [stockLocations.locations]);

    const inRangeChangeovers = useMemo(() => {
        const start = parseISOToDate(range.startISO);
        const end = parseISOToDate(range.endISO);
        if (!start || !end) return [];

        return changeovers
            .filter((c) => {
                if (c.status === "completed") return false;
                const dt = parseISOToDate(c.date);
                if (!dt) return false;
                return dt >= start && dt <= end;
            })
            .sort((a, b) => {
                const ad = a.date ?? "";
                const bd = b.date ?? "";
                if (ad !== bd) return ad.localeCompare(bd);
                return (a.propertyName ?? "").localeCompare(b.propertyName ?? "");
            });
    }, [changeovers, range.startISO, range.endISO]);

    const groups = useMemo<LocationGroup[]>(() => {
        // locationId -> itemKey -> line
        const map = new Map<string, Map<string, ListLine>>();

        function ensureLocation(locationId: string) {
            const inner = map.get(locationId);
            if (inner) return inner;
            const created = new Map<string, ListLine>();
            map.set(locationId, created);
            return created;
        }

        function resolveLocationId(config: PropertyConfig | null): string {
            // property overrides
            if (config?.stockLocationId && config.stockLocationId.trim().length > 0) return config.stockLocationId;

            // workspace default
            if (stockLocations.defaultLocationId) return stockLocations.defaultLocationId;

            // first active
            const firstActive = activeLocations[0];
            if (firstActive) return firstActive.id;

            // fallback bucket
            return "unassigned";
        }

        function addItem(locationId: string, name: string, qty: number, source: { propertyName: string; changeoverId: string; qty: number }) {
            const inner = ensureLocation(locationId);

            const cleanName = name.trim();
            if (!cleanName) return;

            const itemKey = normalizeKey(cleanName);
            const existing = inner.get(itemKey);

            if (existing) {
                existing.qty += qty;
                existing.sources.push(source);
                inner.set(itemKey, existing);
            } else {
                inner.set(itemKey, {
                    itemKey,
                    name: cleanName,
                    qty,
                    sources: [source],
                });
            }
        }

        for (const c of inRangeChangeovers) {
            if (!c.propertyId || !c.id) continue;
            const config = loadPropertyConfig(c.propertyId);
            const locationId = resolveLocationId(config);

            // Welcome pack
            if (includeWelcome && config?.welcomePack) {
                for (const item of config.welcomePack) {
                    if (!item || item.enabled !== true) continue;
                    const qty = Number(item.qty);
                    if (!Number.isFinite(qty) || qty <= 0) continue;

                    addItem(locationId, item.name, qty, {
                        propertyName: c.propertyName ?? "Unknown property",
                        changeoverId: c.id,
                        qty,
                    });
                }
            }

            // Cleaning bundle
            if (includeCleaning && config?.cleaningBundle) {
                for (const item of config.cleaningBundle) {
                    if (!item || item.enabled !== true) continue;
                    const qty = Number(item.qty);
                    if (!Number.isFinite(qty) || qty <= 0) continue;

                    addItem(locationId, item.name, qty, {
                        propertyName: c.propertyName ?? "Unknown property",
                        changeoverId: c.id,
                        qty,
                    });
                }
            }
        }

        // Convert to UI groups with nice names + sorted lines
        const out: LocationGroup[] = [];

        for (const [locationId, inner] of map.entries()) {
            const lines = Array.from(inner.values()).sort((a, b) => a.name.localeCompare(b.name));

            let locationName = "Unassigned";
            if (locationId !== "unassigned") {
                const found = stockLocations.locations.find((l) => l.id === locationId);
                if (found) locationName = found.name + (found.isActive ? "" : " (inactive)");
                else locationName = "Unknown location";
            }

            out.push({ locationId, locationName, lines });
        }

        // Show default location first (if present), then others A→Z
        const def = stockLocations.defaultLocationId;
        out.sort((a, b) => {
            const aDef = def && a.locationId === def ? 0 : 1;
            const bDef = def && b.locationId === def ? 0 : 1;
            if (aDef !== bDef) return aDef - bDef;
            return a.locationName.localeCompare(b.locationName);
        });

        return out;
    }, [
        inRangeChangeovers,
        includeWelcome,
        includeCleaning,
        stockLocations.defaultLocationId,
        stockLocations.locations,
        activeLocations,
    ]);

    const totalLines = useMemo(() => groups.reduce((sum, g) => sum + g.lines.length, 0), [groups]);

    const emptyStateReason = useMemo(() => {
        if (changeovers.length === 0) return "No changeovers found yet.";
        if (inRangeChangeovers.length === 0) return "No upcoming changeovers in the selected window.";
        if (!includeWelcome && !includeCleaning) return "Turn on at least one category (welcome / cleaning).";
        if (groups.length === 0) return "No enabled items found in property templates.";
        return null;
    }, [changeovers.length, inRangeChangeovers.length, includeWelcome, includeCleaning, groups.length]);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Shopping list"
                subtitle={`Required items for the next ${days} day(s) • ${inRangeChangeovers.length} changeover(s) • ${totalLines} line(s)`}
                actions={
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Link href="/app/stock-locations" className={button("secondary")}>
                            Stock locations
                        </Link>
                        <Link href="/app/properties" className={button("secondary")}>
                            Properties
                        </Link>
                    </div>
                }
            />

            {/* Controls */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Window (days)</div>
                        <input
                            type="number"
                            min={0}
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className={input()}
                        />
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            From {formatISOShort(range.startISO)} to {formatISOShort(range.endISO)}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Include</div>
                        <div className="mt-2 space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <input type="checkbox" checked={includeWelcome} onChange={() => setIncludeWelcome((v) => !v)} />
                                Welcome pack items
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <input type="checkbox" checked={includeCleaning} onChange={() => setIncludeCleaning((v) => !v)} />
                                Cleaning bundle items
                            </label>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Laundry mapping is a future step once bed → linen rules are defined.
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">View</div>
                        <div className="mt-2 space-y-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <input type="checkbox" checked={showBreakdown} onChange={() => setShowBreakdown((v) => !v)} />
                                Show per-changeover breakdown
                            </label>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Inventory / on-hand subtraction is future.
                        </div>
                    </div>
                </div>
            </div>

            {/* Output */}
            {emptyStateReason ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                    {emptyStateReason}
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map((g) => (
                        <div
                            key={g.locationId}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {g.locationName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {g.lines.length} line(s)
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {g.lines.map((line) => (
                                    <div
                                        key={line.itemKey}
                                        className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                    {line.name}
                                                </div>
                                                {showBreakdown && (
                                                    <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                                        {line.sources.map((s, idx) => (
                                                            <div key={`${s.changeoverId}-${idx}`} className="flex items-center justify-between gap-3">
                                                                <div className="truncate">
                                                                    {s.propertyName} •{" "}
                                                                    <Link
                                                                        href={`/app/changeovers/${s.changeoverId}`}
                                                                        className="underline font-semibold"
                                                                    >
                                                                        {s.changeoverId}
                                                                    </Link>
                                                                </div>
                                                                <div className="font-semibold">× {s.qty}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                                × {line.qty}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        Tip: If you’re seeing “Unassigned”, open the property setup and pick a stock location.
                    </div>
                </div>
            )}
        </div>
    );
}
