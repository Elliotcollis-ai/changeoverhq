"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/section-header";

export default function NewPropertyPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");

    const canCreate = name.trim().length > 1;

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Add property"
                subtitle="Create the property, then complete the setup steps."
                actions={
                    <button
                        type="button"
                        onClick={() => router.push("/app/properties")}
                        className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                    >
                        Back
                    </button>
                }
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Property name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Rose Cottage"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Location (optional)
                        </label>
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Filey"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => router.push("/app/properties")}
                            className="rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={!canCreate}
                            onClick={() => {
                                const id =
                                    "p-" +
                                    name
                                        .trim()
                                        .toLowerCase()
                                        .replace(/[^a-z0-9]+/g, "-")
                                        .replace(/(^-|-$)/g, "");

                                router.push(`/app/properties/${id}`);
                            }}
                            className="rounded-xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                        >
                            Create & set up
                        </button>
                    </div>

                    {location.trim().length > 0 && (
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                            Saved location will show on the Properties list (mock for now).
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
