import { bridges } from '@toa.io/core/types'
import * as _context from './context'
import * as _core from '@toa.io/core/types';

declare namespace toa.node {

  namespace algorithms {

    type Constructor = () => bridges.Algorithm

    interface Factory {
      create: Constructor
    }

    type func = (input?: any, scope?: object | object[], context?: _context.Context) => Promise<_core.Reply>
  }

  interface Algorithm extends bridges.Algorithm {
    mount?(context?: _context.Context): Promise<void> | void
  }

}

export type Algorithm = toa.node.Algorithm
export type func = toa.node.algorithms.func
