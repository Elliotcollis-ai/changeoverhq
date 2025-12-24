"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";

type PropertyRow = {
    id: string;
    name: string;
    createdAt: string; // ISO
    isActive: boolean;
};

const PROPERTIES_KEY = "changeoverhq.properties.v1";

function safeParseProperties(raw: string): PropertyRow[] {
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        const out: PropertyRow[] = [];
        for (const item of parsed) {
            if (!item || typeof item !== "object") continue;
            const r = item as Record<string, unknown>;
            if (typeof r.id !== "string") continue;
            if (typeof r.name !== "string") continue;
            if (typeof r.createdAt !== "string") continue;

            const isActive = typeof r.isActive === "boolean" ? r.isActive : true;

            out.push({ id: r.id, name: r.name, createdAt: r.createdAt, isActive });
        }
        return out;
    } catch {
        return [];
    }
}

function loadProperties(): PropertyRow[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(PROPERTIES_KEY);
    if (!raw) return [];
    return safeParseProperties(raw);
}

function saveProperties(rows: PropertyRow[]): boolean {
    if (typeof window === "undefined") return false;
    try {
        window.localStorage.setItem(PROPERTIES_KEY, JSON.stringify(rows));
        return true;
    } catch {
        return false;
    }
}

function slugify(input: string): string {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 32);
}

function shortId(): string {
    return Math.random().toString(36).slice(2, 8);
}

export default function NewPropertyPage() {
    const [name, setName] = useState("");
    const [banner, setBanner] = useState<null | { tone: "warn"; text: string }>(null);

    const canCreate = useMemo(() => name.trim().length >= 2, [name]);

    function onCreate() {
        setBanner(null);

        const trimmed = name.trim();
        if (trimmed.length < 2) {
            setBanner({ tone: "warn", text: "Give the property a name (at least 2 characters)." });
            return;
        }

        const base = slugify(trimmed) || "property";
        const id = `${base}-${shortId()}`;

        const existing = loadProperties();
        const createdAt = new Date().toISOString();

        const next: PropertyRow[] = [{ id, name: trimmed, createdAt, isActive: true }, ...existing];

        const ok = saveProperties(next);
        if (!ok) {
            setBanner({ tone: "warn", text: "Could not save. Check browser storage and try again." });
            return;
        }

        window.location.href = `/app/properties/${id}`;
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Add property"
                subtitle="Name your property and we’ll take you straight into setup."
                actions={
                    <Link
                        href="/app/properties"
                        className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition text-center"
                    >
                        Back
                    </Link>
                }
            />

            {banner && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
                    {banner.text}
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Property name
                </label>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Example: “Rose Cottage” or “Seaview Apartment”.
                </p>

                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rose Cottage"
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                />

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onCreate}
                        disabled={!canCreate}
                        className={[
                            "rounded-xl px-4 py-2 text-sm font-semibold transition text-center",
                            canCreate
                                ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed",
                        ].join(" ")}
                    >
                        Create & set up
                    </button>
                </div>

                <div className="mt-4 text-xs text-slate-600 dark:text-slate-300">
                    Next: beds → welcome pack → cleaning bundle.
                </div>
            </div>
        </div>
    );
}
