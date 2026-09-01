// noinspection ES6UnusedImports

import { Connector } from './connector'

declare namespace toa.core {

  namespace atomicity {

    /**
     * What one group of replicas decides together, in one place. The decisions here are the
     * ones processes cannot arrange by talking to each other: they need a single arbiter and a
     * step indivisible from its point of view.
     */
    interface Atom extends Connector {
      /**
       * An exclusive claim on slots of `0..total`: while this replica holds one, no other
       * replica of the group does. Answered from memory, so it costs nothing to ask.
       *
       * `null` while this replica owns nothing — after a restart, during a rollout, or while
       * coordination is unreachable. Whoever asks must be able to stand down: acting on a
       * claim that cannot be supported is a different guarantee, not a degraded one.
       */
      slots (total: number): number[] | null

      /**
       * Debt the group has run up under each key, in milliseconds. Every call adds its own
       * deltas and reads back where the group stands, so a replica reports what it alone has
       * spent and still decides on what all of them have.
       *
       * Rejects where there is nothing to arbitrate through.
       */
      meter (keys: string[], deltas: number[]): Promise<number[]>

      /**
       * Runs `routine` holding `keys`, and while it holds them no other replica of the group
       * does. Waits for as long as it takes to acquire them.
       *
       * Rejects where there is nothing to arbitrate through.
       */
      lock<T> (keys: string | string[], routine: () => Promise<T>): Promise<T>
    }

    interface Factory {
      /** @param group what the replicas deciding together have in common */
      atom (group: string, options?: object): Atom
    }

  }

}

export type Atom = toa.core.atomicity.Atom
export type Factory = toa.core.atomicity.Factory
