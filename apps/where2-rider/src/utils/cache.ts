import { storage } from "@/src/utils/storage";

const CACHE_PREFIX = "api_cache_";
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await storage.getItem<{ data: T; expiry: number } | null>(CACHE_PREFIX + key, null);
    if (!raw) return null;
    if (Date.now() > raw.expiry) {
      await storage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return raw.data;
  } catch {
    return null;
  }
}

export async function setCache(key: string, data: unknown, ttl = DEFAULT_TTL): Promise<void> {
  try {
    await storage.setItem(CACHE_PREFIX + key, {
      data,
      expiry: Date.now() + ttl,
    });
  } catch {}
}
