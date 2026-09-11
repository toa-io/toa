import { Underlay } from '@toa.io/generic/types'
import { Connector } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'
import type { FetchInit } from '@toa.io/extensions.fetch'

declare namespace toa.node {
  interface Context extends Connector {
    local: Underlay
    remote: Underlay
    aspects: Record<string, Function>

    /** The environment this deployment was deployed as. */
    env?: string

    /** The name of the context. */
    name?: string

    /**
     * The rank of the region this deployment is, and what its writes are stamped with. Zero
     * where an application is deployed as one place, which is what its records carry.
     */
    region: number

    /**
     * The name this process answers addressed calls under. A call to a stateful operation names
     * the `instance` of the process it goes to.
     */
    instance: string

    // system aspects
    atom: Atom

    // known extensions
    fetch: (input: string | URL | Request, init?: FetchInit) => Promise<Response>
    amqp?: Underlay
    configuration?: object
    delay?: {
      (
        endpoint: string,
        request: object | null,
        options: { interval: number; overdue: number | null }
      ): Promise<string>
      cancel: (id: string) => Promise<void>
    }
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
    lock: <T>(
      keys: string | string[],
      routine: (signal: AbortSignal, context: unknown) => Promise<T>
    ) => Promise<T>
  }

  type shortcut = (context: Context, aspect: extensions.Aspect) => void
}

export type Context = toa.node.Context
