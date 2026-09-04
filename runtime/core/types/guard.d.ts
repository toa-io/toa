/**
 * Runs on every change to an entity's state, before the contract is applied. `false` refuses
 * the change as `EntityGuard`.
 */
export type Guard<T, C = unknown> = (state: T, origin: T | null, context: C) => boolean
