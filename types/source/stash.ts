import type { RedisCommander } from 'ioredis'
import type { Resources, Routine } from '@toa.io/extensions.stash/transpiled/Aspect'

export interface Stash extends RedisCommander {
  store: <T>(key: string, value: T) => Promise<void>
  fetch: <T>(key: string) => Promise<T>
  lock: <T>(key: Resources, routine: Routine<T>) => Promise<T>
}
