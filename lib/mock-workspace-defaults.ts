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

// Helper so state doesn't share references with the constants
export function cloneTemplateItems(items: TemplateItem[]): TemplateItem[] {
    return items.map((i) => ({ ...i }));
}
