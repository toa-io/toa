export type Guard<T, C = unknown> = (state: T, origin: T | null, context: C) => boolean
