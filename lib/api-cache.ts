type CacheEntry = { value: unknown; expiresAt: number }

const store = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>()

const sweep = () => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key)
  }
}

export async function cachedByKey<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  sweep()

  const hit = store.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.value as T

  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>

  const promise = Promise.resolve()
    .then(loader)
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs })
      inflight.delete(key)
      return value
    })
    .catch((error) => {
      inflight.delete(key)
      throw error
    })

  inflight.set(key, promise)
  return promise
}
