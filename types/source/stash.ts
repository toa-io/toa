import type { RedisCommander } from 'ioredis'

export interface Stash extends RedisCommander {
  store: <T>(key: string, value: T) => Promise<void>
  fetch: <T>(key: string) => Promise<T>
  lock: <T>(key: Resources, routine: Routine<T>) => Promise<T>
}

type Routine<T> = () => Promise<T>
type Resources = string | string[]
