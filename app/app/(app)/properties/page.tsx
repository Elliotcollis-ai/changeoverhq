"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { SummaryBubble } from "@/components/summary-bubble";

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
    const router = useRouter();

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

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Properties"
                subtitle="Add properties and complete setup so changeovers run smoothly."
                actions={
                    <button
                        type="button"
                        onClick={() => router.push("/app/properties/new")}
                        className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                    >
                        Add property
                    </button>
                }
            />

            <div className="space-y-3">
                {properties.map((p) => {
                    const isComplete =
                        p.status.beds && p.status.welcomePack && p.status.cleaningBundle;

                    const setupSummary = [
                        p.status.beds ? "Beds ✓" : "Beds",
                        p.status.welcomePack ? "Welcome pack ✓" : "Welcome pack",
                        p.status.cleaningBundle ? "Cleaning bundle ✓" : "Cleaning bundle",
                    ].join(" • ");

                    return (
                        <SummaryBubble
                            key={p.id}
                            label={p.location ? `${p.name} · ${p.location}` : p.name}
                            summary={setupSummary}
                            isExpanded={false}
                            onClick={() => router.push(`/app/properties/${p.id}`)}
                            tone={isComplete ? "primary" : "default"}
                        />
                    );
                })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Tip
                </div>
                <div className="mt-1">
                    Do <span className="font-semibold">Beds</span> first — it’ll power
                    laundry counts later.
                </div>
            </div>
        </div>
    );
}
