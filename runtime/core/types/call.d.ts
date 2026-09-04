import type { Request } from './request.js'

/**
 * How an endpoint is called. What it resolves to is what the operation declares — `toa types`
 * writes that per operation, and these are what a hand-written context says instead.
 */
export type Call<Output = any, Input = any> = (request: Request<Input>) => Promise<Output>

export type Observation<Output = any, Input = never, Entity = unknown> =
  (request: Request<Input, Entity>) => Promise<Output extends unknown[] ? Output : Output | null>

export type Transition<Output = any, Input = never, Entity = unknown> =
  (request: Request<Input, Entity>) => Promise<Output | null>
