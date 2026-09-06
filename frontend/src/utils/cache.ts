import { storage } from "@/src/utils/storage";

const CACHE_PREFIX = "api_cache_";
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await storage.getItem<string | null>(CACHE_PREFIX + key, null);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      await storage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, data: unknown, ttl = DEFAULT_TTL): Promise<void> {
  try {
    await storage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      expiry: Date.now() + ttl,
    }));
  } catch {}
}
