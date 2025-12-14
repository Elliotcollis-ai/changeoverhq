"use client";

import { Dialog } from "@headlessui/react";
import Link from "next/link";
import { X } from "lucide-react";

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

export function MobileSidebar({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    return (
        <Dialog open={open} onClose={onClose} className="relative z-50 md:hidden">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex">
                <Dialog.Panel className="w-80 max-w-[85%] bg-white p-4 dark:bg-slate-950">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold tracking-wide">
                            CHANGEOVER HQ
                        </div>

                        <button
                            onClick={onClose}
                            className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-900"
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <nav className="mt-4 flex flex-col gap-1">
                        {nav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
