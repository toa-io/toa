import { Underlay } from '@toa.io/generic/types'
import { Connector } from '@toa.io/core'
import { Aspect } from '@toa.io/core/types/extensions'
import type { FetchInit } from '@toa.io/extensions.fetch'

declare namespace toa.node{

  interface Context extends Connector{
    local: Underlay
    remote: Underlay
    aspects: Record<string, Function>

    // system aspects
    atom: Atom

    // known extensions
    fetch: (input: string | URL | Request, init?: FetchInit) => Promise<Response>
    amqp?: Underlay
    configuration?: object
    state?: object
  }

  /** What the replicas of this component decide together. */
  interface Atom {
    /**
     * An exclusive claim on slots of `0..total`, `null` while this replica owns nothing.
     */
    slots: (total: number) => number[] | null

    /** Debt the replicas have run up under each key, in milliseconds. */
    meter: (keys: string[], deltas: number[]) => Promise<number[]>

    /**
     * Runs `routine` while no other replica holds `keys`. The signal aborts when the lease
     * could not be extended.
     */
    lock: <T>(keys: string | string[],
      routine: (signal: AbortSignal, context: unknown) => Promise<T>) => Promise<T>
  }

  type shortcut = (context: Context, aspect: Aspect) => void

}

export type Context = toa.node.Context
