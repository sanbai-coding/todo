interface Identifiable {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

// Union cloud and local records by id. On a same-id conflict, keep whichever
// was modified more recently so neither side's edits are silently dropped.
export function mergeById<T extends Identifiable>(cloudItems: T[], localItems: T[]): T[] {
  const merged = new Map<string, T>();
  for (const item of cloudItems) merged.set(item.id, item);
  for (const item of localItems) {
    const existing = merged.get(item.id);
    if (!existing || (item.updatedAt || item.createdAt) >= (existing.updatedAt || existing.createdAt)) {
      merged.set(item.id, item);
    }
  }
  return Array.from(merged.values());
}
