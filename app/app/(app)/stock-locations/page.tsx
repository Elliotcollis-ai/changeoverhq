"use client";

import { useEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/section-header";

type StockLocation = {
    id: string;
    name: string;
    isActive: boolean;
};

type StockLocationsState = {
    locations: StockLocation[];
    defaultLocationId: string | null;
};

const STORAGE_KEY = "changeoverhq.stockLocations.v1";

function safeParse<T>(raw: string): T | null {
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function uid(prefix = "sl") {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState(): StockLocationsState {
    if (typeof window === "undefined") return { locations: [], defaultLocationId: null };

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        // seed once for MVP
        const seeded: StockLocationsState = {
            locations: [
                { id: "shared-cupboard", name: "Shared cupboard", isActive: true },
                { id: "owner-locker", name: "Owner locker", isActive: true },
                { id: "cleaner-kit", name: "Cleaner kit", isActive: true },
            ],
            defaultLocationId: "shared-cupboard",
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
    }

    const parsed = safeParse<unknown>(raw);
    if (!parsed || typeof parsed !== "object") return { locations: [], defaultLocationId: null };

    const obj = parsed as Partial<StockLocationsState>;
    const locations = Array.isArray(obj.locations) ? (obj.locations as StockLocation[]) : [];
    const defaultLocationId = typeof obj.defaultLocationId === "string" ? obj.defaultLocationId : null;

    // defensive cleanup
    const cleaned = locations
        .filter((l) => l && typeof l.id === "string" && typeof l.name === "string")
        .map((l) => ({
            id: l.id,
            name: l.name.trim() || "Untitled location",
            isActive: typeof l.isActive === "boolean" ? l.isActive : true,
        }));

    const defaultStillExists = defaultLocationId && cleaned.some((l) => l.id === defaultLocationId);
    return {
        locations: cleaned,
        defaultLocationId: defaultStillExists ? defaultLocationId : (cleaned[0]?.id ?? null),
    };
}

function saveState(state: StockLocationsState) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // ignore
    }
}

function inputBase() {
    return [
        "w-full rounded-xl border px-3 py-2 text-sm outline-none",
        "border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-slate-200",
        "dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700",
    ].join(" ");
}

function buttonBase(kind: "primary" | "secondary" | "danger") {
    const base = "rounded-xl px-4 py-2 text-sm font-semibold transition text-center";
    if (kind === "primary") {
        return [
            base,
            "bg-slate-900 text-white hover:bg-slate-800",
            "dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
        ].join(" ");
    }
    if (kind === "danger") {
        return [
            base,
            "border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100",
            "dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-100 dark:hover:bg-rose-900/30",
        ].join(" ");
    }
    return [
        base,
        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        "dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
    ].join(" ");
}

export default function StockLocationsPage() {
    const [state, setState] = useState<StockLocationsState>({ locations: [], defaultLocationId: null });
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        setState(loadState());
    }, []);

    useEffect(() => {
        saveState(state);
    }, [state]);

    const locationsSorted = useMemo(() => {
        // default first, then active, then name
        const def = state.defaultLocationId;
        return [...state.locations].sort((a, b) => {
            const aDef = a.id === def ? 0 : 1;
            const bDef = b.id === def ? 0 : 1;
            if (aDef !== bDef) return aDef - bDef;

            const aActive = a.isActive ? 0 : 1;
            const bActive = b.isActive ? 0 : 1;
            if (aActive !== bActive) return aActive - bActive;

            return a.name.localeCompare(b.name);
        });
    }, [state.locations, state.defaultLocationId]);

    function setDefault(id: string) {
        setState((prev) => ({ ...prev, defaultLocationId: id }));
    }

    function toggleActive(id: string) {
        setState((prev) => ({
            ...prev,
            locations: prev.locations.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l)),
        }));
    }

    function beginRename(id: string, current: string) {
        setEditingId(id);
        setEditingValue(current);
        setConfirmDeleteId(null);
    }

    function cancelRename() {
        setEditingId(null);
        setEditingValue("");
    }

    function saveRename() {
        if (!editingId) return;
        const nextName = editingValue.trim();
        if (!nextName) return;

        setState((prev) => ({
            ...prev,
            locations: prev.locations.map((l) => (l.id === editingId ? { ...l, name: nextName } : l)),
        }));
        cancelRename();
    }

    function addLocation() {
        const name = newName.trim();
        if (!name) return;

        const id = uid();
        setState((prev) => {
            const next: StockLocationsState = {
                ...prev,
                locations: [...prev.locations, { id, name, isActive: true }],
                defaultLocationId: prev.defaultLocationId ?? id,
            };
            return next;
        });
        setNewName("");
    }

    function deleteLocation(id: string) {
        setState((prev) => {
            const remaining = prev.locations.filter((l) => l.id !== id);
            let defaultLocationId = prev.defaultLocationId;

            if (defaultLocationId === id) {
                defaultLocationId = remaining[0]?.id ?? null;
            }

            return { locations: remaining, defaultLocationId };
        });

        setConfirmDeleteId(null);
        if (editingId === id) cancelRename();
    }

    const defaultName = useMemo(() => {
        const def = state.defaultLocationId;
        if (!def) return "None";
        const loc = state.locations.find((l) => l.id === def);
        return loc?.name ?? "None";
    }, [state.defaultLocationId, state.locations]);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Stock locations"
                subtitle={`Create the places you store supplies (e.g. shared cupboard, owner locker). Default: ${defaultName}.`}
            />

            {/* Add new */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add a stock location</div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Shared cupboard"
                        className={inputBase()}
                    />
                    <button type="button" onClick={addLocation} className={buttonBase("primary")}>
                        Add
                    </button>
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Tip: keep names consistent across properties so shopping lists can group neatly later.
                </div>
            </div>

            {/* List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your locations</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Default is used when a property hasn’t chosen a location yet.
                        </div>
                    </div>
                </div>

                {locationsSorted.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                        No locations yet. Add one above.
                    </div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {locationsSorted.map((loc) => {
                            const isDefault = loc.id === state.defaultLocationId;
                            const isEditing = editingId === loc.id;
                            const isConfirmingDelete = confirmDeleteId === loc.id;

                            return (
                                <div
                                    key={loc.id}
                                    className={[
                                        "rounded-xl border p-3",
                                        "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
                                        !loc.isActive ? "opacity-70" : "",
                                    ].join(" ")}
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {isEditing ? (
                                                    <input
                                                        value={editingValue}
                                                        onChange={(e) => setEditingValue(e.target.value)}
                                                        className={inputBase()}
                                                        aria-label="Rename stock location"
                                                    />
                                                ) : (
                                                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                        {loc.name}
                                                    </div>
                                                )}

                                                {isDefault && (
                                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                                        Default
                                                    </span>
                                                )}

                                                {!loc.isActive && (
                                                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>

                                            {!isEditing && (
                                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    ID: <span className="font-mono">{loc.id}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button type="button" onClick={saveRename} className={buttonBase("primary")}>
                                                        Save
                                                    </button>
                                                    <button type="button" onClick={cancelRename} className={buttonBase("secondary")}>
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDefault(loc.id)}
                                                        className={buttonBase("secondary")}
                                                        disabled={isDefault}
                                                    >
                                                        Set default
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => beginRename(loc.id, loc.name)}
                                                        className={buttonBase("secondary")}
                                                    >
                                                        Rename
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActive(loc.id)}
                                                        className={buttonBase("secondary")}
                                                    >
                                                        {loc.isActive ? "Set inactive" : "Set active"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setConfirmDeleteId((prev) => (prev === loc.id ? null : loc.id));
                                                            setEditingId(null);
                                                        }}
                                                        className={buttonBase("danger")}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {isConfirmingDelete && !isEditing && (
                                        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-100">
                                            <div className="font-semibold">Delete this stock location?</div>
                                            <div className="mt-1 text-sm">
                                                This is local-only for now. If it’s currently the default, another location will become default.
                                            </div>
                                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => deleteLocation(loc.id)}
                                                    className={buttonBase("danger")}
                                                >
                                                    Yes, delete
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className={buttonBase("secondary")}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
