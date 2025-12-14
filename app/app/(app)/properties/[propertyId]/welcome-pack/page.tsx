"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { SummaryBubble } from "@/components/summary-bubble";

type ExpandedKey = "welcome" | null;

type WelcomeItem = {
    id: string;
    name: string;
    qty: number;
    enabled: boolean;
};

export default function PropertyWelcomePackPage() {
    const params = useParams<{ propertyId: string }>();
    const router = useRouter();
    const propertyId = params.propertyId;

    const [expandedKey, setExpandedKey] = useState<ExpandedKey>("welcome");

    const [items, setItems] = useState<WelcomeItem[]>([
        { id: "tea", name: "Tea bags", qty: 10, enabled: true },
        { id: "coffee", name: "Coffee sachets", qty: 6, enabled: true },
        { id: "milk", name: "UHT milk (mini)", qty: 2, enabled: false },
        { id: "biscuits", name: "Biscuits", qty: 1, enabled: true },
    ]);

    const enabledCount = useMemo(
        () => items.filter((i) => i.enabled).length,
        [items]
    );

    const summary =
        enabledCount === 0
            ? "No welcome pack items enabled"
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
                title="Welcome pack template"
                subtitle="Tick items on/off and set quantities. Add custom items as needed."
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
                    label="Welcome pack"
                    summary={summary}
                    isExpanded={expandedKey === "welcome"}
                    onClick={() =>
                        setExpandedKey(expandedKey === "welcome" ? null : "welcome")
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
                                                    Enabled items will be suggested per changeover (later: shopping list support).
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
