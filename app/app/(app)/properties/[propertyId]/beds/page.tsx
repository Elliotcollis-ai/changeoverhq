"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { SummaryBubble } from "@/components/summary-bubble";

type ExpandedKey = "beds" | null;

type BedType = "Double" | "King" | "Single" | "Bunk" | "Sofa bed";

type BedRow = {
    type: BedType;
    count: number;
};

export default function PropertyBedsPage() {
    const params = useParams<{ propertyId: string }>();
    const router = useRouter();
    const propertyId = params.propertyId;

    const [expandedKey, setExpandedKey] = useState<ExpandedKey>("beds");

    const [beds, setBeds] = useState<BedRow[]>([
        { type: "Double", count: 1 },
        { type: "Single", count: 2 },
    ]);

    const totalBeds = useMemo(
        () =>
            beds.reduce((sum, b) => sum + (Number.isFinite(b.count) ? b.count : 0), 0),
        [beds]
    );

    const summary = totalBeds
        ? beds.map((b) => `${b.count} ${b.type}`).join(", ")
        : "No beds set yet";

    function updateCount(index: number, next: number) {
        setBeds((prev) =>
            prev.map((row, i) => (i === index ? { ...row, count: next } : row))
        );
    }

    function updateType(index: number, nextType: BedType) {
        setBeds((prev) =>
            prev.map((row, i) => (i === index ? { ...row, type: nextType } : row))
        );
    }

    function addBedRow() {
        setBeds((prev) => [...prev, { type: "Double", count: 1 }]);
    }

    function removeBedRow(index: number) {
        setBeds((prev) => prev.filter((_, i) => i !== index));
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Beds"
                subtitle="Set bed types and counts. Later this will drive laundry quantities."
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
                    label="Beds configuration"
                    summary={summary}
                    isExpanded={expandedKey === "beds"}
                    onClick={() => setExpandedKey(expandedKey === "beds" ? null : "beds")}
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
                                {beds.map((row, idx) => (
                                    <div key={`${row.type}-${idx}`} className="flex gap-2">
                                        <select
                                            value={row.type}
                                            onChange={(e) => updateType(idx, e.target.value as BedType)}
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
                                            onChange={(e) => updateCount(idx, Number(e.target.value))}
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
                                    onClick={() => router.push(`/app/properties/${propertyId}`)}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                                >
                                    Save
                                </button>
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-300">
                                Later: we’ll map bed types to laundry items (sheets, duvet covers,
                                pillowcases, towels).
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
