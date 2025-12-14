"use client";

import * as React from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { TopBar } from "@/components/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [menuOpen, setMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen">
            <TopBar onOpenMenu={() => setMenuOpen(true)} />
            <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

            <div className="mx-auto flex max-w-6xl">
                <Sidebar />
                <main className="flex-1 p-4">{children}</main>
            </div>
        </div>
    );
}
