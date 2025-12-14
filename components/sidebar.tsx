import Link from "next/link";

const nav = [
    { href: "/app/dashboard", label: "Dashboard" },
    { href: "/app/properties", label: "Properties" },
    { href: "/app/bookings", label: "Bookings" },
    { href: "/app/changeovers", label: "Changeovers" },
    { href: "/app/supplies", label: "Supplies" },
    { href: "/app/stock-locations", label: "Stock Locations" },
    { href: "/app/insights", label: "Insights" },
    { href: "/app/settings", label: "Settings" },
];

export function Sidebar() {
    return (
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex">
            <div className="p-4 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                NAVIGATION
            </div>

            <nav className="flex flex-1 flex-col gap-1 px-2 pb-4">
                {nav.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
