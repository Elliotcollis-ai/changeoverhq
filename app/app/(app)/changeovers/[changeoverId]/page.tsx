"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { SummaryBubble } from "@/components/summary-bubble";

import { LaundryDetails } from "@/components/laundry-details";
import { WelcomePackDetails } from "@/components/welcome-pack-details";
import { CleaningDetails } from "@/components/cleaning-details";

type ExpandedKey = "datetime" | "cleaner" | "laundry" | "welcome" | "cleaning" | null;

export default function ChangeoverDetailPage() {
    const params = useParams<{ changeoverId: string }>();
    const changeoverId = params.changeoverId;

    const [expanded, setExpanded] = useState<ExpandedKey>(null);

    // Mock data (intentional)
    const propertyName = "Rose Cottage";
    const dateLabel = "Mon 8 Jan";
    const status: "upcoming" | "today" | "completed" = "upcoming";

    const summaries = {
        datetime: "Arrive 11:00 • Leave 15:00",
        cleaner: "Sarah (2h 30m)",
        laundry: "2 doubles • 1 king • 8 pillowcases",
        welcome: "Milk • Eggs • Biscuits • Tea bags",
        cleaning: "Toilet roll • Bin bags • Dishwasher tabs • Sponges",
    };

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

    return (
        <div className="space-y-6">
            <PageHeader propertyName={propertyName} dateLabel={dateLabel} status={status} />

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
                            <LaundryDetails />
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
                            <WelcomePackDetails />
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
                            <CleaningDetails />
                        </div>
                    </div>
                </div>
            </div>

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
    );
}
