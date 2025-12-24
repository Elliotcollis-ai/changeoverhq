"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

            // Backwards compatible: default to active if field missing
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

function hasSavedConfig(propertyId: string): boolean {
    if (typeof window === "undefined") return false;
    const key = `changeoverhq.property.${propertyId}.config.v1`;
    return window.localStorage.getItem(key) != null;
}

function deletePropertyLocalData(propertyId: string) {
    if (typeof window === "undefined") return;

    const keysToRemove = [
        `changeoverhq.property.${propertyId}.config.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`, // older variants safe to attempt
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        `changeoverhq.property.${propertyId}.seed.v1`,
        // The one we actually use:
        `changeoverhq.property.${propertyId}.seed.v1`,
        // If you ever stored an initialised flag:
        `changeoverhq.property.${propertyId}.initialised`,
        // The seed key used earlier:
        `changeoverhq.property.${propertyId}.seed.v1`,
    ];

    // De-dupe and remove
    for (const key of Array.from(new Set(keysToRemove))) {
        try {
            window.localStorage.removeItem(key);
        } catch {
            // ignore
        }
    }

    // Also remove any other keys that start with changeoverhq.property.<id>.
    // (Future-proof if you add more per-property keys.)
    try {
        const prefix = `changeoverhq.property.${propertyId}.`;
        const toRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && k.startsWith(prefix)) toRemove.push(k);
        }
        for (const k of toRemove) window.localStorage.removeItem(k);
    } catch {
        // ignore
    }
}

export default function PropertiesPage() {
    const [properties, setProperties] = useState<PropertyRow[]>([]);
    const [configMap, setConfigMap] = useState<Record<string, boolean>>({});

    function refreshConfigMap(rows: PropertyRow[]) {
        const map: Record<string, boolean> = {};
        for (const p of rows) {
            map[p.id] = hasSavedConfig(p.id);
        }
        setConfigMap(map);
    }

    useEffect(() => {
        const stored = loadProperties();
        setProperties(stored);
        refreshConfigMap(stored);
    }, []);

    const sorted = useMemo(() => {
        const copy = [...properties].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        // Active first, then inactive
        copy.sort((a, b) => Number(b.isActive) - Number(a.isActive));
        return copy;
    }, [properties]);

    function setInactive(propertyId: string, nextActive: boolean) {
        setProperties((prev) => {
            const next = prev.map((p) => (p.id === propertyId ? { ...p, isActive: nextActive } : p));
            saveProperties(next);
            return next;
        });
    }

    function onDelete(propertyId: string, name: string) {
        const ok = window.confirm(
            `Delete "${name}"?\n\nThis will remove it from your properties list and clear its local saved data (beds/templates).`
        );
        if (!ok) return;

        setProperties((prev) => {
            const next = prev.filter((p) => p.id !== propertyId);
            saveProperties(next);
            return next;
        });

        deletePropertyLocalData(propertyId);

        // Update map after delete
        setConfigMap((prev) => {
            const next = { ...prev };
            delete next[propertyId];
            return next;
        });
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Properties"
                subtitle="Add and configure your holiday lets. Each property has its own beds and templates."
                actions={
                    <Link
                        href="/app/properties/new"
                        className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition text-center"
                    >
                        Add property
                    </Link>
                }
            />

            {sorted.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        No properties yet
                    </div>
                    <div className="mt-2">
                        Create your first property and we’ll walk you through beds, welcome pack, and cleaning
                        bundle.
                    </div>
                    <div className="mt-4">
                        <Link
                            href="/app/properties/new"
                            className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                        >
                            Add your first property
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {sorted.map((p) => {
                        const configured = !!configMap[p.id];

                        return (
                            <div
                                key={p.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <Link
                                        href={`/app/properties/${p.id}`}
                                        className="min-w-0 flex-1 rounded-xl hover:opacity-95 transition"
                                    >
                                        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                            {p.name}
                                        </div>
                                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Property ID: <span className="font-semibold">{p.id}</span>
                                        </div>
                                        {!p.isActive && (
                                            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                This property is inactive (hidden from day-to-day ops later).
                                            </div>
                                        )}
                                    </Link>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div
                                            className={[
                                                "rounded-full border px-3 py-1 text-xs font-semibold",
                                                !p.isActive
                                                    ? "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                                                    : configured
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100"
                                                        : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100",
                                            ].join(" ")}
                                        >
                                            {!p.isActive ? "Inactive" : configured ? "Configured ✓" : "Needs setup"}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setInactive(p.id, !p.isActive)}
                                                className="rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition"
                                            >
                                                {p.isActive ? "Set inactive" : "Set active"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onDelete(p.id, p.name)}
                                                className="rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {p.isActive && !configured && (
                                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                                        Tip: open setup and hit <span className="font-semibold">Save changes</span> when
                                        you’re done.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
