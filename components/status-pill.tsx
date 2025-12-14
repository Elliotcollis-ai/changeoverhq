type Status = "upcoming" | "today" | "completed";

const styles: Record<Status, string> = {
    upcoming:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",

    today:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",

    completed:
        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export function StatusPill({ status }: { status: Status }) {
    const label =
        status === "upcoming"
            ? "Upcoming"
            : status === "today"
                ? "Today"
                : "Completed";

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
        >
            {label}
        </span>
    );
}
