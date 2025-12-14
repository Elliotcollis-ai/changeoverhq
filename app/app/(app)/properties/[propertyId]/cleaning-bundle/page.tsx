"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { SummaryBubble } from "@/components/summary-bubble";

type ExpandedKey = "cleaning" | null;

type CleaningItem = {
    id: string;
    name: string;
    qty: number;
    enabled: boolean;
};

export default function PropertyCleaningBundlePage() {
    const params = useParams<{ propertyId: string }>();
    const router = useRouter();
    const propertyId = params.propertyId;

    const [expandedKey, setExpandedKey] = useState<ExpandedKey>("cleaning");

    const [items, setItems] = useState<CleaningItem[]>([
        { id: "toilet-rolls", name: "Toilet rolls", qty: 4, enabled: true },
        { id: "bin-bags", name: "Bin bags", qty: 10, enabled: true },
        { id: "sponges", name: "Sponges", qty: 2, enabled: true },
        { id: "cloths", name: "Microfibre cloths", qty: 2, enabled: true },
    ]);

    const enabledCount = useMemo(
        () => items.filter((i) => i.enabled).length,
        [items]
    );

    const summary =
        enabledCount === 0
            ? "No cleaning items enabled"
            : `${enabledCount} item${enabledCount === 1 ? "" : "s"} enabled`;

    function toggleItem(id: string) {
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i))
        );
    }

    function updateQty(id: string, qty: number) {
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, qty } : i))
        );
    }

    function updateName(id: string, name: string) {
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, name } : i))
        );
    }

    function addCustomItem() {
        const id = `custom-${Date.now()}`;
        setItems((prev) => [
            ...prev,
            { id, name: "Custom item", qty: 1, enabled: true },
        ]);
    }

    function removeItem(id: string) {
        setItems((prev) => prev.filter((i) => i.id !== id));
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Cleaning bundle template"
                subtitle="Cleaning supplies and consumables per changeover. Inventory tracking is a future feature."
                actions={
                    <button
                        type="button"
                        onClick={() => router.push(`/app/properties/${propertyId}`)}
                        className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                    >
                        Back
                    </button>
                }
            />

            <div className="space-y-3">
                <SummaryBubble
                    label="Cleaning bundle"
                    summary={summary}
                    isExpanded={expandedKey === "cleaning"}
                    onClick={() =>
                        setExpandedKey(expandedKey === "cleaning" ? null : "cleaning")
                    }
                    tone="default"
                />

                <div
                    className={[
                        "rounded-2xl border bg-white shadow-sm dark:bg-slate-900",
                        "border-slate-200 dark:border-slate-800",
                        "grid transition-[grid-template-rows] duration-200",
                        expandedKey ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    ].join(" ")}
                >
                    <div className="overflow-hidden">
                        <div className="p-4 space-y-4">
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                                    >
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={item.enabled}
                                                onChange={() => toggleItem(item.id)}
                                                className="mt-1 h-4 w-4"
                                            />

                                            <div className="min-w-0 flex-1 space-y-2">
                                                <input
                                                    value={item.name}
                                                    onChange={(e) => updateName(item.id, e.target.value)}
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
                                                            updateQty(item.id, Number(e.target.value))
                                                        }
                                                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                                                    />

                                                    {item.id.startsWith("custom-") && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(item.id)}
                                                            className="ml-auto rounded-xl px-3 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="text-xs text-slate-600 dark:text-slate-300">
                                                    Enabled items will be suggested per changeover (later: shopping lists).
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={addCustomItem}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                                >
                                    Add custom item
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.push(`/app/properties/${propertyId}`)}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                                >
                                    Save
                                </button>
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-300">
                                Stock does not auto-decrement on completion (future setting).
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
