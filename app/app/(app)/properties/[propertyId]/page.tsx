"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { SectionHeader } from "@/components/section-header";
import { SummaryBubble } from "@/components/summary-bubble";

import {
    cleaningBundleDefaults,
    cloneTemplateItems,
    loadWorkspaceDefaults,
    welcomePackDefaults,
} from "@/lib/mock-workspace-defaults";

type ExpandedKey = "beds" | "welcome" | "cleaning" | null;

type BedType = "Double" | "King" | "Single" | "Bunk" | "Sofa bed";

type BedRow = {
    type: BedType;
    count: number;
};

type TemplateItem = {
    id: string;
    name: string;
    qty: number;
    enabled: boolean;
    isCustom?: boolean;
};

type PropertyConfig = {
    beds: BedRow[];
    welcomePack: TemplateItem[];
    cleaningBundle: TemplateItem[];
};

export default function PropertyDetailPage() {
    const params = useParams<{ propertyId: string }>();
    const propertyId = params.propertyId;

    const [expanded, setExpanded] = useState<ExpandedKey>("beds");

    const seedKey = `changeoverhq.property.${propertyId}.seed.v1`;
    const configKey = `changeoverhq.property.${propertyId}.config.v1`;

    function safeParseConfig(raw: string): PropertyConfig | null {
        try {
            const parsed = JSON.parse(raw) as Partial<PropertyConfig>;
            if (!parsed || typeof parsed !== "object") return null;

            if (!Array.isArray(parsed.beds)) return null;
            if (!Array.isArray(parsed.welcomePack)) return null;
            if (!Array.isArray(parsed.cleaningBundle)) return null;

            return {
                beds: parsed.beds as BedRow[],
                welcomePack: parsed.welcomePack as TemplateItem[],
                cleaningBundle: parsed.cleaningBundle as TemplateItem[],
            };
        } catch {
            return null;
        }
    }

    function readStoredConfig(): PropertyConfig | null {
        if (typeof window === "undefined") return null;
        const raw = window.localStorage.getItem(configKey);
        if (!raw) return null;
        return safeParseConfig(raw);
    }

    function readSeed(): { welcomePack: TemplateItem[]; cleaningBundle: TemplateItem[] } | null {
        if (typeof window === "undefined") return null;
        try {
            const raw = window.localStorage.getItem(seedKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as { welcomePack?: unknown; cleaningBundle?: unknown };
            if (!Array.isArray(parsed.welcomePack) || !Array.isArray(parsed.cleaningBundle)) return null;
            return {
                welcomePack: parsed.welcomePack as TemplateItem[],
                cleaningBundle: parsed.cleaningBundle as TemplateItem[],
            };
        } catch {
            return null;
        }
    }

    function writeSeed(seed: { welcomePack: TemplateItem[]; cleaningBundle: TemplateItem[] }) {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(seedKey, JSON.stringify(seed));
        } catch {
            // ignore
        }
    }

    function ensureSeed(): { welcomePack: TemplateItem[]; cleaningBundle: TemplateItem[] } {
        const existing = readSeed();
        if (existing) {
            return {
                welcomePack: cloneTemplateItems(existing.welcomePack),
                cleaningBundle: cloneTemplateItems(existing.cleaningBundle),
            };
        }

        const storedDefaults = loadWorkspaceDefaults();
        const seed = {
            welcomePack: cloneTemplateItems(storedDefaults?.welcomePack ?? welcomePackDefaults),
            cleaningBundle: cloneTemplateItems(storedDefaults?.cleaningBundle ?? cleaningBundleDefaults),
        };

        writeSeed(seed);
        return {
            welcomePack: cloneTemplateItems(seed.welcomePack),
            cleaningBundle: cloneTemplateItems(seed.cleaningBundle),
        };
    }

    // 1) Try load saved property config (if user previously clicked Save)
    // 2) Else seed from workspace defaults ONCE
    const storedConfig = typeof window !== "undefined" ? readStoredConfig() : null;
    const seed = typeof window !== "undefined" ? ensureSeed() : null;

    const [beds, setBeds] = useState<BedRow[]>(() => {
        if (storedConfig?.beds) return storedConfig.beds;
        return [
            { type: "Double", count: 1 },
            { type: "Single", count: 2 },
        ];
    });

    const [welcomeItems, setWelcomeItems] = useState<TemplateItem[]>(() => {
        if (storedConfig?.welcomePack) return cloneTemplateItems(storedConfig.welcomePack);
        if (seed) return cloneTemplateItems(seed.welcomePack);
        return cloneTemplateItems(welcomePackDefaults);
    });

    const [cleaningItems, setCleaningItems] = useState<TemplateItem[]>(() => {
        if (storedConfig?.cleaningBundle) return cloneTemplateItems(storedConfig.cleaningBundle);
        if (seed) return cloneTemplateItems(seed.cleaningBundle);
        return cloneTemplateItems(cleaningBundleDefaults);
    });

    const [banner, setBanner] = useState<null | { tone: "ok" | "warn"; text: string }>(null);

    function saveProperty() {
        if (typeof window === "undefined") return;

        const payload: PropertyConfig = {
            beds,
            welcomePack: welcomeItems,
            cleaningBundle: cleaningItems,
        };

        try {
            window.localStorage.setItem(configKey, JSON.stringify(payload));
            setBanner({ tone: "ok", text: "Saved. This property is now independent of workspace defaults." });
        } catch {
            setBanner({ tone: "warn", text: "Could not save to browser storage. Try again." });
        }
    }

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

    const bedsTotal = useMemo(() => {
        return beds.reduce((sum, b) => sum + (Number.isFinite(b.count) ? b.count : 0), 0);
    }, [beds]);

    const bedsConfigured = bedsTotal > 0;

    const welcomeEnabled = useMemo(() => welcomeItems.filter((i) => i.enabled), [welcomeItems]);
    const welcomeConfigured = welcomeEnabled.length > 0;

    const cleaningEnabled = useMemo(() => cleaningItems.filter((i) => i.enabled), [cleaningItems]);
    const cleaningConfigured = cleaningEnabled.length > 0;

    const setupDoneCount = [bedsConfigured, welcomeConfigured, cleaningConfigured].filter(Boolean)
        .length;

    function nextIncompleteFrom(current: ExpandedKey): ExpandedKey {
        const order: ExpandedKey[] = ["beds", "welcome", "cleaning"];
        const startIndex = current ? Math.max(order.indexOf(current), 0) + 1 : 0;

        const statusMap: Record<Exclude<ExpandedKey, null>, boolean> = {
            beds: bedsConfigured,
            welcome: welcomeConfigured,
            cleaning: cleaningConfigured,
        };

        for (let i = startIndex; i < order.length; i++) {
            const key = order[i];
            if (key && !statusMap[key]) return key;
        }

        for (let i = 0; i < order.length; i++) {
            const key = order[i];
            if (key && !statusMap[key]) return key;
        }

        return null;
    }

    function handleDone(section: Exclude<ExpandedKey, null>) {
        const next = nextIncompleteFrom(section);
        setExpanded(next);
    }

    function doneLabelFor(section: Exclude<ExpandedKey, null>) {
        const next = nextIncompleteFrom(section);
        if (!next) return "Finish setup";
        return "Done (next)";
    }

    const bedsSummary = useMemo(() => {
        if (!bedsConfigured) return "Not set (add at least 1 bed)";
        return `Configured ✓ • ${beds.map((b) => `${b.count} ${b.type}`).join(", ")}`;
    }, [beds, bedsConfigured]);

    const welcomeSummary = useMemo(() => {
        if (!welcomeConfigured) return "Not set (enable at least 1 item)";
        const sample = welcomeEnabled.slice(0, 3).map((i) => i.name).join(" • ");
        const more = welcomeEnabled.length > 3 ? ` • +${welcomeEnabled.length - 3} more` : "";
        return `Configured ✓ • ${sample}${more}`;
    }, [welcomeConfigured, welcomeEnabled]);

    const cleaningSummary = useMemo(() => {
        if (!cleaningConfigured) return "Not set (enable at least 1 item)";
        const sample = cleaningEnabled.slice(0, 3).map((i) => i.name).join(" • ");
        const more = cleaningEnabled.length > 3 ? ` • +${cleaningEnabled.length - 3} more` : "";
        return `Configured ✓ • ${sample}${more}`;
    }, [cleaningConfigured, cleaningEnabled]);

    function updateBedCount(index: number, next: number) {
        setBeds((prev) => prev.map((row, i) => (i === index ? { ...row, count: next } : row)));
    }

    function updateBedType(index: number, nextType: BedType) {
        setBeds((prev) => prev.map((row, i) => (i === index ? { ...row, type: nextType } : row)));
    }

    function addBedRow() {
        setBeds((prev) => [...prev, { type: "Double", count: 1 }]);
    }

    function removeBedRow(index: number) {
        setBeds((prev) => prev.filter((_, i) => i !== index));
    }

    function toggleItem(itemsSetter: typeof setWelcomeItems, id: string) {
        itemsSetter((prev) => prev.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i)));
    }

    function updateQty(itemsSetter: typeof setWelcomeItems, id: string, qty: number) {
        itemsSetter((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
    }

    function updateName(itemsSetter: typeof setWelcomeItems, id: string, name: string) {
        itemsSetter((prev) => prev.map((i) => (i.id === id ? { ...i, name } : i)));
    }

    function addCustom(itemsSetter: typeof setWelcomeItems) {
        const id = `custom-${Date.now()}`;
        itemsSetter((prev) => [...prev, { id, name: "", qty: 1, enabled: true, isCustom: true }]);
    }

    function removeCustom(itemsSetter: typeof setWelcomeItems, id: string) {
        itemsSetter((prev) => prev.filter((i) => i.id !== id));
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Property setup"
                subtitle={`Property ID: ${propertyId} • ${setupDoneCount}/3 complete`}
                actions={
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={saveProperty}
                            className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition text-center"
                        >
                            Save changes
                        </button>

                        <Link
                            href="/app/properties"
                            className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                        >
                            Back to properties
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

            <div className="space-y-3">
                <SummaryBubble
                    label="Beds configuration"
                    summary={bedsSummary}
                    isExpanded={expanded === "beds"}
                    onClick={() => toggle("beds")}
                    tone={bedsConfigured ? "primary" : "default"}
                />
                <div className={panelClasses(expanded === "beds")}>
                    <div className="overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                Set bed types and counts. Later this will drive laundry quantities.
                            </div>

                            <div className="space-y-3">
                                {beds.map((row, idx) => (
                                    <div key={`${row.type}-${idx}`} className="flex gap-2">
                                        <select
                                            value={row.type}
                                            onChange={(e) => updateBedType(idx, e.target.value as BedType)}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                                        >
                                            <option>Double</option>
                                            <option>King</option>
                                            <option>Single</option>
                                            <option>Bunk</option>
                                            <option>Sofa bed</option>
                                        </select>

                                        <input
                                            type="number"
                                            min={0}
                                            value={row.count}
                                            onChange={(e) => updateBedCount(idx, Number(e.target.value))}
                                            className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeBedRow(idx)}
                                            className="rounded-xl px-3 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={addBedRow}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                >
                                    Add bed type
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDone("beds")}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                                >
                                    {doneLabelFor("beds")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <SummaryBubble
                    label="Welcome pack template"
                    summary={welcomeSummary}
                    isExpanded={expanded === "welcome"}
                    onClick={() => toggle("welcome")}
                    tone={welcomeConfigured ? "primary" : "default"}
                />
                <div className={panelClasses(expanded === "welcome")}>
                    <div className="overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                This property starts from workspace defaults (seeded once) — tweak as needed.
                            </div>

                            <div className="space-y-3">
                                {welcomeItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                                    >
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={item.enabled}
                                                onChange={() => toggleItem(setWelcomeItems, item.id)}
                                                className="mt-1 h-4 w-4"
                                            />

                                            <div className="min-w-0 flex-1 space-y-2">
                                                <input
                                                    value={item.name}
                                                    onChange={(e) => updateName(setWelcomeItems, item.id, e.target.value)}
                                                    placeholder={item.isCustom ? "Custom item name" : ""}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                                                />

                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                        Qty
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={item.qty}
                                                        onChange={(e) =>
                                                            updateQty(setWelcomeItems, item.id, Number(e.target.value))
                                                        }
                                                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                                                    />

                                                    {item.isCustom && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCustom(setWelcomeItems, item.id)}
                                                            className="ml-auto rounded-xl px-3 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => addCustom(setWelcomeItems)}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                >
                                    Add custom item
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDone("welcome")}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                                >
                                    {doneLabelFor("welcome")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <SummaryBubble
                    label="Cleaning bundle template"
                    summary={cleaningSummary}
                    isExpanded={expanded === "cleaning"}
                    onClick={() => toggle("cleaning")}
                    tone={cleaningConfigured ? "primary" : "default"}
                />
                <div className={panelClasses(expanded === "cleaning")}>
                    <div className="overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                This property starts from workspace defaults (seeded once) — tweak as needed.
                            </div>

                            <div className="space-y-3">
                                {cleaningItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                                    >
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={item.enabled}
                                                onChange={() => toggleItem(setCleaningItems, item.id)}
                                                className="mt-1 h-4 w-4"
                                            />

                                            <div className="min-w-0 flex-1 space-y-2">
                                                <input
                                                    value={item.name}
                                                    onChange={(e) => updateName(setCleaningItems, item.id, e.target.value)}
                                                    placeholder={item.isCustom ? "Custom item name" : ""}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                                                />

                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                        Qty
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={item.qty}
                                                        onChange={(e) =>
                                                            updateQty(setCleaningItems, item.id, Number(e.target.value))
                                                        }
                                                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                                                    />

                                                    {item.isCustom && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCustom(setCleaningItems, item.id)}
                                                            className="ml-auto rounded-xl px-3 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => addCustom(setCleaningItems)}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                >
                                    Add custom item
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDone("cleaning")}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                                >
                                    {doneLabelFor("cleaning")}
                                </button>
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-300">
                                Stock does not auto-decrement on completion (future setting).
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {setupDoneCount === 3 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100">
                    <div className="font-semibold">Setup complete ✓</div>
                    <div className="mt-1">Nice — this property is ready for smooth changeovers.</div>
                </div>
            )}
        </div>
    );
}
