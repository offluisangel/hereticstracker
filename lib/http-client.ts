type CacheEntry<T> = { value: T; expiresAt: number }

type FetchOptions = RequestInit & {
  cacheTtlMs?: number
  signal?: AbortSignal
}

const inflight = new Map<string, Promise<unknown>>()
const responseCache = new Map<string, CacheEntry<unknown>>()
const DEFAULT_CACHE_TTL = 60_000

const retryAfterMs = (response: Response) => {
  const retryAfter = response.headers.get("Retry-After")
  const seconds = retryAfter ? Number(retryAfter) : 0
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 10_000) : 0
}

export async function fetchApiJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { cacheTtlMs = DEFAULT_CACHE_TTL, signal, ...requestInit } = options
  const cached = responseCache.get(url)
  if (cached && cached.expiresAt > Date.now()) return cached.value as T

  const pending = inflight.get(url)
  if (pending) return pending as Promise<T>

  const promise = (async () => {
    let response = await fetch(url, { ...requestInit, signal })
    if (response.status === 429) {
      const delay = retryAfterMs(response)
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
      response = await fetch(url, { ...requestInit, signal })
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const value = (await response.json()) as T
    responseCache.set(url, { value, expiresAt: Date.now() + cacheTtlMs })
    return value
  })().finally(() => inflight.delete(url))

  inflight.set(url, promise)
  return promise
}
