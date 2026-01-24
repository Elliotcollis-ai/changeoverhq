"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { SummaryBubble } from "@/components/summary-bubble";

import { LaundryDetails } from "@/components/laundry-details";
import { WelcomePackDetails } from "@/components/welcome-pack-details";
import { CleaningDetails } from "@/components/cleaning-details";

type ExpandedKey = "datetime" | "cleaner" | "laundry" | "welcome" | "cleaning" | null;

type ChangeoverRow = {
    id: string;
    propertyId: string;
    propertyName: string;
    date: string; // YYYY-MM-DD
    status: "upcoming" | "today" | "completed";
};

type PropertyConfig = {
    beds: { type: string; count: number }[];
    welcomePack: { id: string; name: string; qty: number; enabled: boolean }[];
    cleaningBundle: { id: string; name: string; qty: number; enabled: boolean }[];
};

type ItemRow = { name: string; qty: number };

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

function formatISODateLabel(iso: string): string {
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
    }).format(dt);
}

function plural(n: number, s: string) {
    return `${n} ${s}${n === 1 ? "" : "s"}`;
}

function normaliseType(t: string) {
    return t.trim().toLowerCase();
}

function computeLaundryFromBeds(beds: { type: string; count: number }[]): ItemRow[] {
    // MVP linen rules:
    // Double: duvet×1, fitted sheet×1, pillowcases×2
    // King:   duvet×1, fitted sheet×1, pillowcases×2
    // Single: duvet×1, fitted sheet×1, pillowcase×1
    const totals: Record<string, number> = {};

    function add(name: string, qty: number) {
        totals[name] = (totals[name] ?? 0) + qty;
    }

    for (const b of beds) {
        const type = normaliseType(b.type);
        const count = Number.isFinite(b.count) ? b.count : 0;
        if (count <= 0) continue;

        if (type === "double") {
            add("Double duvet cover", count * 1);
            add("Double fitted sheet", count * 1);
            add("Pillowcases", count * 2);
        } else if (type === "king") {
            add("King duvet cover", count * 1);
            add("King fitted sheet", count * 1);
            add("Pillowcases", count * 2);
        } else if (type === "single") {
            add("Single duvet cover", count * 1);
            add("Single fitted sheet", count * 1);
            add("Pillowcases", count * 1);
        } else {
            // Unknown type: don’t guess linen
        }
    }

    const out: ItemRow[] = Object.entries(totals).map(([name, qty]) => ({ name, qty }));
    // Prefer a stable, readable order
    const order = [
        "Double duvet cover",
        "King duvet cover",
        "Single duvet cover",
        "Double fitted sheet",
        "King fitted sheet",
        "Single fitted sheet",
        "Pillowcases",
    ];
    out.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    return out;
}

function summaryFromLaundryItems(items: ItemRow[], beds: { type: string; count: number }[]) {
    if (beds.length === 0) return "No beds set";

    const doubles = beds.find((b) => normaliseType(b.type) === "double")?.count ?? 0;
    const kings = beds.find((b) => normaliseType(b.type) === "king")?.count ?? 0;
    const singles = beds.find((b) => normaliseType(b.type) === "single")?.count ?? 0;

    const parts: string[] = [];
    if (doubles) parts.push(`${doubles} double${doubles === 1 ? "" : "s"}`);
    if (kings) parts.push(`${kings} king${kings === 1 ? "" : "s"}`);
    if (singles) parts.push(`${singles} single${singles === 1 ? "" : "s"}`);

    // If pillowcases present, append count
    const pcs = items.find((i) => i.name === "Pillowcases")?.qty ?? 0;
    if (pcs) parts.push(`${pcs} pillowcase${pcs === 1 ? "" : "s"}`);

    return parts.length ? parts.join(" • ") : "Beds set (linen not mapped)";
}

function summaryFromItems(items: ItemRow[]) {
    if (items.length === 0) return "None";
    const top = items.slice(0, 4).map((i) => i.name);
    return top.join(" • ");
}

export default function ChangeoverDetailPage() {
    const params = useParams<{ changeoverId: string }>();
    const changeoverId = params.changeoverId;

    const [expanded, setExpanded] = useState<ExpandedKey>(null);

    const [changeover, setChangeover] = useState<ChangeoverRow | null>(null);
    const [banner, setBanner] = useState<null | { tone: "ok" | "warn"; text: string }>(null);

    const [propertyConfig, setPropertyConfig] = useState<PropertyConfig | null>(null);
    const [propertyConfigMissing, setPropertyConfigMissing] = useState(false);

    useEffect(() => {
        const all = loadChangeovers();
        const found = all.find((c) => c.id === changeoverId) ?? null;
        setChangeover(found);
    }, [changeoverId]);

    useEffect(() => {
        if (!changeover?.propertyId) {
            setPropertyConfig(null);
            setPropertyConfigMissing(false);
            return;
        }

        const key = `changeoverhq.property.${changeover.propertyId}.config.v1`;
        const raw = window.localStorage.getItem(key);

        if (!raw) {
            setPropertyConfig(null);
            setPropertyConfigMissing(true);
            return;
        }

        const parsed = safeParse<PropertyConfig>(raw);
        if (!parsed || !Array.isArray(parsed.beds)) {
            setPropertyConfig(null);
            setPropertyConfigMissing(true);
            return;
        }

        setPropertyConfig(parsed);
        setPropertyConfigMissing(false);
    }, [changeover?.propertyId]);

    const propertyName = changeover?.propertyName ?? "Unknown property";
    const dateLabel = changeover?.date ? formatISODateLabel(changeover.date) : "Unknown date";
    const status: "upcoming" | "today" | "completed" = changeover?.status ?? "upcoming";

    const canMarkCompleted = useMemo(() => {
        return !!changeover && changeover.status !== "completed";
    }, [changeover]);

    const beds = useMemo(() => propertyConfig?.beds ?? [], [propertyConfig]);

    const laundryItems = useMemo(() => {
        if (!propertyConfig) return [];
        return computeLaundryFromBeds(propertyConfig.beds ?? []);
    }, [propertyConfig]);

    const welcomeItems = useMemo(() => {
        if (!propertyConfig) return [];
        return (propertyConfig.welcomePack ?? [])
            .filter((i) => i.enabled)
            .map((i) => ({ name: i.name, qty: i.qty }));
    }, [propertyConfig]);

    const cleaningItems = useMemo(() => {
        if (!propertyConfig) return [];
        return (propertyConfig.cleaningBundle ?? [])
            .filter((i) => i.enabled)
            .map((i) => ({ name: i.name, qty: i.qty }));
    }, [propertyConfig]);

    function toggle(key: Exclude<ExpandedKey, null>) {
        setExpanded((prev) => (prev === key ? null : key));
    }

    function panelClasses(show: boolean) {
        return [
            "rounded-2xl border bg-white shadow-sm dark:bg-slate-900",
            "border-slate-200 dark:border-slate-800",
            "grid transition-[grid-template-rows] duration-200",
            show ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ");
    }

    function markAsCompleted() {
        if (!changeover) {
            setBanner({ tone: "warn", text: "Changeover not found. Generate changeovers from Bookings." });
            return;
        }

        const all = loadChangeovers();
        const idx = all.findIndex((c) => c.id === changeoverId);

        if (idx === -1) {
            setBanner({ tone: "warn", text: "Changeover not found in storage. Try generating again." });
            return;
        }

        const nextRow: ChangeoverRow = { ...all[idx], status: "completed" };
        const nextAll = [...all];
        nextAll[idx] = nextRow;

        const ok = saveChangeovers(nextAll);
        if (!ok) {
            setBanner({ tone: "warn", text: "Could not save. Check browser storage and try again." });
            return;
        }

        setChangeover(nextRow);
        setBanner({ tone: "ok", text: "Marked as completed. If you want, update stock now." });
    }

    const summaries = {
        datetime: "Arrive 11:00 • Leave 15:00",
        cleaner: "Sarah (2h 30m)",
        laundry: propertyConfig ? summaryFromLaundryItems(laundryItems, beds) : "2 doubles • 1 king • 8 pillowcases",
        welcome: propertyConfig ? summaryFromItems(welcomeItems) : "Milk • Eggs • Biscuits • Tea bags",
        cleaning: propertyConfig ? summaryFromItems(cleaningItems) : "Toilet roll • Bin bags • Dishwasher tabs • Sponges",
    };

    return (
        <div className="space-y-6">
            <PageHeader propertyName={propertyName} dateLabel={dateLabel} status={status} />

            {banner && (
                <div
                    className={[
                        "rounded-2xl border p-4 text-sm shadow-sm",
                        banner.tone === "ok"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100"
                            : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100",
                    ].join(" ")}
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>{banner.text}</div>

                        {banner.tone === "ok" && (
                            <Link
                                href={`/app/changeovers/${changeoverId}/stock-update`}
                                className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition text-center"
                            >
                                Stock update
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {!changeover && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                    This changeover wasn’t found in local storage. Go to Bookings and generate changeovers,
                    then try again.
                </div>
            )}

            {changeover && propertyConfigMissing && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                    This property hasn’t been set up yet (beds / templates). Go to{" "}
                    <Link href={`/app/properties/${changeover.propertyId}`} className="font-semibold underline">
                        property setup
                    </Link>{" "}
                    and hit <span className="font-semibold">Save changes</span>.
                </div>
            )}

            <div className="space-y-3">
                <SummaryBubble
                    label="Date & time"
                    summary={summaries.datetime}
                    isExpanded={expanded === "datetime"}
                    onClick={() => toggle("datetime")}
                    tone="default"
                />
                <div className={panelClasses(expanded === "datetime")}>
                    <div className="overflow-hidden">
                        <div className="p-6">
                            <div className="space-y-2">
                                <h2 className="text-sm font-semibold">Date & time</h2>
                                <div className="text-sm text-slate-700 dark:text-slate-200">
                                    <div>
                                        <span className="font-semibold">Changeover ID:</span> {changeoverId}
                                    </div>
                                    {changeover?.date && (
                                        <div className="mt-2">
                                            <span className="font-semibold">Changeover date:</span>{" "}
                                            {formatISODateLabel(changeover.date)}
                                        </div>
                                    )}
                                    <div className="mt-2">Arrival window: 11:00</div>
                                    <div>Departure deadline: 15:00</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SummaryBubble
                    label="Cleaner"
                    summary={summaries.cleaner}
                    isExpanded={expanded === "cleaner"}
                    onClick={() => toggle("cleaner")}
                    tone="default"
                />
                <div className={panelClasses(expanded === "cleaner")}>
                    <div className="overflow-hidden">
                        <div className="p-6">
                            <div className="space-y-2">
                                <h2 className="text-sm font-semibold">Cleaner</h2>
                                <div className="text-sm text-slate-700 dark:text-slate-200">
                                    Assigned cleaner: Sarah
                                    <div className="mt-2">Estimated duration: 2h 30m</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SummaryBubble
                    label="Laundry"
                    summary={summaries.laundry}
                    isExpanded={expanded === "laundry"}
                    onClick={() => toggle("laundry")}
                    tone="default"
                />
                <div className={panelClasses(expanded === "laundry")}>
                    <div className="overflow-hidden">
                        <div className="p-6">
                            {propertyConfig ? (
                                <div>
                                    <h2 className="text-sm font-semibold">Laundry required</h2>

                                    {laundryItems.length === 0 ? (
                                        <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                                            No laundry items could be calculated (check bed types).
                                        </div>
                                    ) : (
                                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                                            {laundryItems.map((i) => (
                                                <li key={i.name}>
                                                    {i.name} × {i.qty}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                                        Based on beds:{" "}
                                        {beds.length === 0
                                            ? "none"
                                            : beds
                                                .map((b) => `${b.type} × ${b.count}`)
                                                .join(" • ")}
                                    </div>
                                </div>
                            ) : (
                                <LaundryDetails />
                            )}
                        </div>
                    </div>
                </div>

                <SummaryBubble
                    label="Welcome pack"
                    summary={summaries.welcome}
                    isExpanded={expanded === "welcome"}
                    onClick={() => toggle("welcome")}
                    tone="default"
                />
                <div className={panelClasses(expanded === "welcome")}>
                    <div className="overflow-hidden">
                        <div className="p-6">
                            {propertyConfig ? (
                                <div>
                                    <h2 className="text-sm font-semibold">Welcome pack</h2>

                                    {welcomeItems.length === 0 ? (
                                        <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                                            No welcome pack items enabled.
                                        </div>
                                    ) : (
                                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                                            {welcomeItems.map((i) => (
                                                <li key={i.name}>
                                                    {i.name} × {i.qty}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <WelcomePackDetails />
                            )}
                        </div>
                    </div>
                </div>

                <SummaryBubble
                    label="Cleaning supplies"
                    summary={summaries.cleaning}
                    isExpanded={expanded === "cleaning"}
                    onClick={() => toggle("cleaning")}
                    tone="default"
                />
                <div className={panelClasses(expanded === "cleaning")}>
                    <div className="overflow-hidden">
                        <div className="p-6">
                            {propertyConfig ? (
                                <div>
                                    <h2 className="text-sm font-semibold">Cleaning supplies</h2>

                                    {cleaningItems.length === 0 ? (
                                        <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                                            No cleaning bundle items enabled.
                                        </div>
                                    ) : (
                                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                                            {cleaningItems.map((i) => (
                                                <li key={i.name}>
                                                    {i.name} × {i.qty}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <CleaningDetails />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <button
                    type="button"
                    onClick={markAsCompleted}
                    disabled={!canMarkCompleted}
                    className={[
                        "rounded-xl px-4 py-2 text-sm font-semibold transition text-center",
                        canMarkCompleted
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed",
                    ].join(" ")}
                >
                    Mark as completed
                </button>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Link
                        href={`/app/changeovers/${changeoverId}/checklist`}
                        className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                    >
                        Open checklist
                    </Link>

                    <Link
                        href={`/app/changeovers/${changeoverId}/stock-update`}
                        className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition text-center"
                    >
                        Stock update
                    </Link>
                </div>
            </div>
        </div>
    );
}
