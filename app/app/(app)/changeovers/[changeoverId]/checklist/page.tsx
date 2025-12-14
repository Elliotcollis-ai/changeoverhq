"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";

function ChecklistItem({ title, note }: { title: string; note?: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-slate-300 dark:border-slate-700"
                />
                <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {title}
                    </div>
                    {note ? (
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {note}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default function ChangeoverChecklistPage() {
    const params = useParams<{ changeoverId: string }>();
    const changeoverId = params.changeoverId;

    return (
        <div className="space-y-6">
            <PageHeader
                propertyName="Sea View Cottage"
                dateLabel="Tue 12 Mar"
                status="upcoming"
            />

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Checklist</h2>
                <Link
                    href={`/app/changeovers/${changeoverId}`}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                    Back
                </Link>
            </div>

            {/* Sections */}
            <div className="space-y-3">
                <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                    LAUNDRY
                </div>
                <ChecklistItem title="Bring correct linen for beds" note="2 doubles, 1 king" />
                <ChecklistItem title="Replace towels" />
                <ChecklistItem title="Bag used linen for collection" />
            </div>

            <div className="space-y-3">
                <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                    WELCOME PACK
                </div>
                <ChecklistItem title="Add milk" />
                <ChecklistItem title="Add eggs" />
                <ChecklistItem title="Add biscuits" note="Border biscuits × 2" />
                <ChecklistItem title="Top up tea/coffee" />
            </div>

            <div className="space-y-3">
                <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                    CLEANING
                </div>
                <ChecklistItem title="Kitchen surfaces cleaned" />
                <ChecklistItem title="Bathroom cleaned" />
                <ChecklistItem title="Bins emptied" />
                <ChecklistItem title="Toilet rolls replenished" note="2 rolls" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Tip: The checklist is optional — use it for new staff, new properties, or when you want consistency.
            </div>
        </div>
    );
}
