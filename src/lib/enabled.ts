export type EnabledItem = {
  enabled?: boolean;
};

export function enabledOnly<T extends EnabledItem>(items: T[]) {
  return items.filter((item) => item.enabled !== false);
}
