import { StatusPill } from "@/components/status-pill";

export function PageHeader({
    propertyName,
    dateLabel,
    status,
}: {
    propertyName: string;
    dateLabel: string;
    status: "upcoming" | "today" | "completed";
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">{propertyName}</h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Changeover • {dateLabel}
                    </p>
                </div>

                <StatusPill status={status} />
            </div>
        </div>
    );
}
