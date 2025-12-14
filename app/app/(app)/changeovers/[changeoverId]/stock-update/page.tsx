"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";

function QtyRow({
    item,
    suggested,
}: {
    item: string;
    suggested: number;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Suggested usage: {suggested}
                    </div>
                </div>

                <input
                    type="number"
                    defaultValue={suggested}
                    min={0}
                    className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
            </div>
        </div>
    );
}

export default function StockUpdatePage() {
    const params = useParams<{ changeoverId: string }>();
    const changeoverId = params.changeoverId;

    return (
        <div className="space-y-6">
            <PageHeader
                propertyName="Sea View Cottage"
                dateLabel="Tue 12 Mar"
                status="completed"
            />

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Update stock</h2>
                <Link
                    href={`/app/changeovers/${changeoverId}`}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                    Back
                </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                This is an MVP stub. Later we’ll connect this to inventory + stock locations and let users confirm what was actually used.
            </div>

            <div className="space-y-3">
                <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                    LAUNDRY (USED)
                </div>
                <QtyRow item="Double duvet cover" suggested={2} />
                <QtyRow item="King duvet cover" suggested={1} />
                <QtyRow item="Pillowcases" suggested={8} />
            </div>

            <div className="space-y-3">
                <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                    WELCOME PACK (USED)
                </div>
                <QtyRow item="Milk" suggested={1} />
                <QtyRow item="Eggs" suggested={1} />
                <QtyRow item="Biscuits (Border)" suggested={2} />
            </div>

            <div className="space-y-3">
                <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                    CLEANING SUPPLIES (USED)
                </div>
                <QtyRow item="Toilet roll" suggested={2} />
                <QtyRow item="Bin bags" suggested={2} />
                <QtyRow item="Dishwasher tabs" suggested={3} />
                <QtyRow item="Sponges" suggested={1} />
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => alert("Later: this will write stock usage to inventory.")}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                    Save stock update
                </button>

                <Link
                    href={`/app/changeovers/${changeoverId}`}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                    Skip for now
                </Link>
            </div>
        </div>
    );
}
