"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { SummaryBubble } from "@/components/summary-bubble";

type SetupStatus = {
    beds: boolean;
    welcomePack: boolean;
    cleaningBundle: boolean;
};

export default function PropertySetupHubPage() {
    const params = useParams<{ propertyId: string }>();
    const router = useRouter();

    const propertyId = params.propertyId;

    // Mock: later comes from DB
    const status = useMemo<SetupStatus>(
        () => ({
            beds: false,
            welcomePack: false,
            cleaningBundle: false,
        }),
        []
    );

    const completeCount = [status.beds, status.welcomePack, status.cleaningBundle]
        .filter(Boolean).length;

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Property setup"
                subtitle={`Complete the setup steps (${completeCount}/3).`}
                actions={
                    <button
                        type="button"
                        onClick={() => router.push("/app/properties")}
                        className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                    >
                        Back to properties
                    </button>
                }
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Property ID
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {propertyId}
                </div>
            </div>

            <div className="space-y-3">
                <SummaryBubble
                    label="Beds"
                    summary={
                        status.beds
                            ? "Configured ✓"
                            : "Set bed types and counts (powers laundry later)"
                    }
                    isExpanded={false}
                    onClick={() => router.push(`/app/properties/${propertyId}/beds`)}
                    tone={status.beds ? "primary" : "default"}
                />

                <SummaryBubble
                    label="Welcome pack template"
                    summary={
                        status.welcomePack
                            ? "Configured ✓"
                            : "Choose items + quantities (tick list + custom items)"
                    }
                    isExpanded={false}
                    onClick={() =>
                        router.push(`/app/properties/${propertyId}/welcome-pack`)
                    }
                    tone={status.welcomePack ? "primary" : "default"}
                />

                <SummaryBubble
                    label="Cleaning bundle template"
                    summary={
                        status.cleaningBundle
                            ? "Configured ✓"
                            : "Cleaning/consumables + quantities for each changeover"
                    }
                    isExpanded={false}
                    onClick={() =>
                        router.push(`/app/properties/${propertyId}/cleaning-bundle`)
                    }
                    tone={status.cleaningBundle ? "primary" : "default"}
                />
            </div>
        </div>
    );
}
