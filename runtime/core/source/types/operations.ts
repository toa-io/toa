import type { Request } from './request.js'

export type type = 'transition' | 'observation' | 'assignment' | 'computation' | 'effect'
  | 'unmanaged'

export type scope = 'object' | 'objects' | 'changeset' | 'stream' | 'none'

/**
 * How an endpoint is called. What it resolves to is what the operation declares — `toa types`
 * writes that per operation, and these are what a hand-written context says instead.
 */
export type Call<Output = any, Input = any> = (request: Request<Input>) => Promise<Output>

export type Observation<Output = any, Input = never, Entity = unknown> =
  (request: Request<Input, Entity>) => Promise<Output extends unknown[] ? Output : Output | null>

export type Transition<Output = any, Input = never, Entity = unknown> =
  (request: Request<Input, Entity>) => Promise<Output | null>

/**
 * Runs on every change to an entity's state, before the contract is applied. `false` refuses
 * the change as `EntityGuard`.
 */
export type Guard<T, C = unknown> = (state: T, origin: T | null, context: C) => boolean
