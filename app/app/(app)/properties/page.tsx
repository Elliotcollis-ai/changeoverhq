"use client";

import Link from "next/link";
import { useMemo } from "react";
import { SectionHeader } from "@/components/section-header";

type PropertySetupStatus = {
    beds: boolean;
    welcomePack: boolean;
    cleaningBundle: boolean;
};

type Property = {
    id: string;
    name: string;
    location?: string;
    status: PropertySetupStatus;
};

export default function PropertiesPage() {
    const properties = useMemo<Property[]>(
        () => [
            {
                id: "p-rose-cottage",
                name: "Rose Cottage",
                location: "Filey",
                status: { beds: true, welcomePack: false, cleaningBundle: true },
            },
            {
                id: "p-the-loft",
                name: "The Loft",
                location: "Scarborough",
                status: { beds: false, welcomePack: false, cleaningBundle: false },
            },
            {
                id: "p-marina-view",
                name: "Marina View",
                location: "Whitby",
                status: { beds: true, welcomePack: true, cleaningBundle: true },
            },
        ],
        []
    );

    function doneCount(s: PropertySetupStatus) {
        return [s.beds, s.welcomePack, s.cleaningBundle].filter(Boolean).length;
    }

    function pill(label: string, isDone: boolean) {
        return (
            <span
                className={[
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                    isDone
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                ].join(" ")}
            >
                {label}
                {isDone ? " ✓" : ""}
            </span>
        );
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Properties"
                subtitle="Add properties and complete setup so changeovers run smoothly."
                actions={
                    <Link
                        href="/app/properties/new"
                        className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                    >
                        Add property
                    </Link>
                }
            />

            <div className="space-y-3">
                {properties.map((p) => {
                    const complete = doneCount(p.status);
                    const isComplete = complete === 3;

                    return (
                        <div
                            key={p.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {p.name}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                        {p.location ? p.location : "No location set"}
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {pill("Beds", p.status.beds)}
                                        {pill("Welcome pack", p.status.welcomePack)}
                                        {pill("Cleaning bundle", p.status.cleaningBundle)}
                                    </div>

                                    <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                                        <span className="font-semibold">{complete}/3</span> setup complete
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    <Link
                                        href={`/app/properties/${p.id}`}
                                        className={[
                                            "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition text-center",
                                            isComplete
                                                ? "border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                                                : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
                                        ].join(" ")}
                                    >
                                        {isComplete ? "View" : "Set up"}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Tip</div>
                <div className="mt-1">
                    Start with <span className="font-semibold">Beds</span> — it’ll power laundry counts later.
                </div>
            </div>
        </div>
    );
}
