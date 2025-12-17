"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { SummaryBubble } from "@/components/summary-bubble";

import {
    cleaningBundleDefaults,
    cloneTemplateItems,
    welcomePackDefaults,
} from "@/lib/mock-workspace-defaults";

type ExpandedKey = "welcome" | "cleaning" | null;

type TemplateItem = {
    id: string;
    name: string;
    qty: number;
    enabled: boolean;
    isCustom?: boolean;
};

export default function DefaultsPage() {
    const [expanded, setExpanded] = useState<ExpandedKey>("welcome");

    // Local-only (mock) workspace defaults state
    const [welcomeItems, setWelcomeItems] = useState<TemplateItem[]>(() =>
        cloneTemplateItems(welcomePackDefaults)
    );
    const [cleaningItems, setCleaningItems] = useState<TemplateItem[]>(() =>
        cloneTemplateItems(cleaningBundleDefaults)
    );

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

    const welcomeEnabled = useMemo(() => welcomeItems.filter((i) => i.enabled), [welcomeItems]);
    const cleaningEnabled = useMemo(() => cleaningItems.filter((i) => i.enabled), [cleaningItems]);

    const welcomeSummary = useMemo(() => {
        if (welcomeEnabled.length === 0) return "Not set (enable at least 1 item)";
        const sample = welcomeEnabled.slice(0, 3).map((i) => i.name).join(" • ");
        const more = welcomeEnabled.length > 3 ? ` • +${welcomeEnabled.length - 3} more` : "";
        return `Configured ✓ • ${sample}${more}`;
    }, [welcomeEnabled]);

    const cleaningSummary = useMemo(() => {
        if (cleaningEnabled.length === 0) return "Not set (enable at least 1 item)";
        const sample = cleaningEnabled.slice(0, 3).map((i) => i.name).join(" • ");
        const more = cleaningEnabled.length > 3 ? ` • +${cleaningEnabled.length - 3} more` : "";
        return `Configured ✓ • ${sample}${more}`;
    }, [cleaningEnabled]);

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

    function resetWelcome() {
        setWelcomeItems(cloneTemplateItems(welcomePackDefaults));
    }

    function resetCleaning() {
        setCleaningItems(cloneTemplateItems(cleaningBundleDefaults));
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Workspace defaults"
                subtitle="Set your default welcome pack and cleaning bundle. New properties can start from these."
                actions={
                    <Link
                        href="/app/settings"
                        className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                    >
                        Back
                    </Link>
                }
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Heads up</div>
                <div className="mt-1">
                    This page is <span className="font-semibold">mock</span> for now — changes aren’t saved
                    yet. Next step will be wiring these defaults into new properties.
                </div>
            </div>

            <div className="space-y-3">
                {/* Welcome pack defaults */}
                <SummaryBubble
                    label="Default welcome pack"
                    summary={welcomeSummary}
                    isExpanded={expanded === "welcome"}
                    onClick={() => toggle("welcome")}
                    tone={welcomeEnabled.length > 0 ? "primary" : "default"}
                />

                <div className={panelClasses(expanded === "welcome")}>
                    <div className="overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                Tick items on/off and set quantities. Add custom items if needed.
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
                                    onClick={resetWelcome}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                                >
                                    Reset to starter defaults
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cleaning bundle defaults */}
                <SummaryBubble
                    label="Default cleaning bundle"
                    summary={cleaningSummary}
                    isExpanded={expanded === "cleaning"}
                    onClick={() => toggle("cleaning")}
                    tone={cleaningEnabled.length > 0 ? "primary" : "default"}
                />

                <div className={panelClasses(expanded === "cleaning")}>
                    <div className="overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                Cleaning supplies and consumables per changeover.
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
                                    onClick={resetCleaning}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                                >
                                    Reset to starter defaults
                                </button>
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-300">
                                Inventory tracking and stock decrementing are future features.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Next</div>
                <div className="mt-1">
                    Next step is to make new properties start from these defaults (still mock), then later
                    persist them in a database.
                </div>
            </div>
        </div>
    );
}
