import { type CacheControlFlag, type CacheControlMap } from './types'

export const SAFE_METHODS = ['GET', 'OPTIONS', 'HEAD']

export function isSafeMethod (method: string): boolean {
  return SAFE_METHODS.includes(method)
}

export function parseCacheControlFlags (headerValue: string): CacheControlMap {
  const flags: CacheControlMap = {
    public: false,
    private: false,
    'no-cache': false
  }
  const matches = headerValue.match(/\bprivate\b|\bpublic\b|\bno-cache\b/ig)

  if (matches !== null)
    for (const key of matches)
      flags[key as CacheControlFlag] = true

  return flags
}
