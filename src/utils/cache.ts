interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing && Date.now() < existing.expiry) {
    return Promise.resolve(existing.data);
  }
  return fn().then((data) => {
    store.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  });
}

export function clearCache(): void {
  store.clear();
}
