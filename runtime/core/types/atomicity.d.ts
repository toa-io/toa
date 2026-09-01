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
    }

    interface Factory {
      /** @param group what the replicas deciding together have in common */
      atom (group: string, options?: object): Atom
    }

  }

}

export type Atom = toa.core.atomicity.Atom
export type Factory = toa.core.atomicity.Factory
