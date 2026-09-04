import type { Request } from '@toa.io/core'

export type { Maybe } from './maybe.js'
export type { Query, RemoteError, Request } from '@toa.io/core'

/** @deprecated a call resolves to the output, `null`, or a `RemoteError`; see `@toa.io/core`. */
export type Call<Output = any, Input = any> = (request: Request<Input>) => Promise<Output>

/** @deprecated see `@toa.io/core`. */
export type Observation<Output = any, Input = never, Entity = unknown> = (request: Request<Input, Entity>) => Promise<Output extends unknown[] ? Output : Output | null>

/** @deprecated see `@toa.io/core`. */
export type Transition<Output = any, Input = never, Entity = unknown> = (request: Request<Input, Entity>) => Promise<Output | null>
