import type { Call, Observation, Stash, Transition, telemetry } from '@toa.io/types'
import type { Entity } from './Entity.js'

export interface Context {
  stash: Stash
  fetch: Fetch
  logs: telemetry.Logs
  local: {
    observe: Observation<Entity>
    transit: Call<Entity, TransitInput>
  }
  configuration: Configuration
}

export type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export type TransitInput = Omit<Entity, 'id' | '_created'>

export interface Configuration {
  /** Origins whose Client ID Metadata Documents may be read. Empty admits nobody. */
  readonly trust: string[]

  /** Seconds a document is held before it is read again. */
  readonly lifetime: number

  /** Seconds a registration nothing has used is kept. */
  readonly ttl: number

  /** Bytes of a document that are read. */
  readonly size: number

  /** Milliseconds a document has to arrive. */
  readonly timeout: number
}

export type { Transition }
