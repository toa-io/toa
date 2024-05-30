import { bridges } from '@toa.io/core'
import * as _context from './context'
import * as _core from '@toa.io/core'

declare namespace toa.node {

  namespace algorithms {

    type Constructor = () => bridges.Algorithm

    interface Factory {
      create: Constructor
    }

    type func = (input?: any, scope?: object | object[], context?: _context.Context) => Promise<_core.Reply>
  }

  interface Algorithm {
    mount? (context: _context.Context): Promise<void> | void

    unmount? (): Promise<void> | void

    execute (input: any, scope: object | object[]): Promise<any>

    execute (input: any): Promise<_core.Reply>
  }

}

export type Algorithm = toa.node.Algorithm
export type func = toa.node.algorithms.func
