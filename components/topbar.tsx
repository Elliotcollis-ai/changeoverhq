"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar({ onOpenMenu }: { onOpenMenu?: () => void }) {
    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    {/* Mobile menu button */}
                    <button
                        type="button"
                        onClick={onOpenMenu}
                        className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden"
                        aria-label="Open menu"
                    >
                        <Menu size={18} />
                    </button>

                    {/* Placeholder logo block */}
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white dark:from-slate-800 dark:to-slate-950">
                        <span className="text-xs font-semibold">CH</span>
                    </div>

                    <div className="leading-tight">
                        <div className="text-sm font-semibold tracking-wide">
                            CHANGEOVER HQ
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Clean. Stock. Sorted.
                        </div>
                    </div>
                </div>

                <ThemeToggle />
            </div>
        </header>
    );
}
