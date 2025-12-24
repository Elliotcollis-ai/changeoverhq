export type TemplateItem = {
    id: string;
    name: string;
    qty: number;
    enabled: boolean;
    isCustom?: boolean;
};

export const welcomePackDefaults: TemplateItem[] = [
    { id: "milk", name: "Milk", qty: 1, enabled: true },
    { id: "eggs", name: "Eggs", qty: 1, enabled: false },
    { id: "biscuits", name: "Biscuits", qty: 2, enabled: true },
    { id: "tea", name: "Tea bags", qty: 1, enabled: true },
];

export const cleaningBundleDefaults: TemplateItem[] = [
    { id: "toilet-roll", name: "Toilet roll", qty: 2, enabled: true },
    { id: "bin-bags", name: "Bin bags", qty: 2, enabled: true },
    { id: "dishwasher-tabs", name: "Dishwasher tabs", qty: 3, enabled: true },
    { id: "sponges", name: "Sponges", qty: 1, enabled: true },
];

export const WORKSPACE_DEFAULTS_STORAGE_KEY = "changeoverhq.workspaceDefaults.v1";

export function cloneTemplateItems(items: TemplateItem[]): TemplateItem[] {
    return items.map((i) => ({ ...i }));
}

export function safeParseTemplateItems(value: unknown): TemplateItem[] | null {
    if (!Array.isArray(value)) return null;

    const items: TemplateItem[] = [];
    for (const raw of value) {
        if (!raw || typeof raw !== "object") return null;
        const r = raw as Record<string, unknown>;

        if (typeof r.id !== "string") return null;
        if (typeof r.name !== "string") return null;
        if (typeof r.qty !== "number") return null;
        if (typeof r.enabled !== "boolean") return null;

        items.push({
            id: r.id,
            name: r.name,
            qty: r.qty,
            enabled: r.enabled,
            isCustom: typeof r.isCustom === "boolean" ? r.isCustom : undefined,
        });
    }

    return items;
}

export function loadWorkspaceDefaults():
    | { welcomePack: TemplateItem[]; cleaningBundle: TemplateItem[] }
    | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(WORKSPACE_DEFAULTS_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as {
            welcomePack?: unknown;
            cleaningBundle?: unknown;
        };

        const welcomePack = safeParseTemplateItems(parsed.welcomePack);
        const cleaningBundle = safeParseTemplateItems(parsed.cleaningBundle);

        if (!welcomePack || !cleaningBundle) return null;

        return {
            welcomePack: cloneTemplateItems(welcomePack),
            cleaningBundle: cloneTemplateItems(cleaningBundle),
        };
    } catch {
        return null;
    }
}

export function saveWorkspaceDefaults(input: {
    welcomePack: TemplateItem[];
    cleaningBundle: TemplateItem[];
}): boolean {
    if (typeof window === "undefined") return false;

    try {
        window.localStorage.setItem(
            WORKSPACE_DEFAULTS_STORAGE_KEY,
            JSON.stringify({
                welcomePack: input.welcomePack,
                cleaningBundle: input.cleaningBundle,
            })
        );
        return true;
    } catch {
        return false;
    }
}
