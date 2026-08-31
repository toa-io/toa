// noinspection ES6UnusedImports

import { Connector } from './connector'

declare namespace toa.core {

  namespace atomicity {

    /**
     * Which of a fixed number of slots this replica owns, exclusively: while it holds one, no
     * other replica of the group does. Answered from memory, so it costs nothing to ask.
     */
    interface Partition extends Connector {
      /**
       * `null` while this replica owns nothing — after a restart, during a rollout, or while
       * coordination is unreachable. Whoever asks must be able to stand down: acting on a claim
       * that cannot be supported is a different guarantee, not a degraded one.
       */
      slots (total: number): number[] | null
    }

    interface Factory {
      /** @param group what the replicas registering together have in common */
      partition (group: string, options?: object): Partition
    }

  }

}

export type Partition = toa.core.atomicity.Partition
export type Factory = toa.core.atomicity.Factory
