import type { bridges } from '@toa.io/core/types'
import * as _context from './context.js'
import type * as _core from '@toa.io/core/types'

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

/**
 * What an operation module exports when it is written as a class: this bridge is what
 * mounts one and runs it.
 */
export interface Operation<Input = any, Output = any> {
  mount?: (context: any) => void | Promise<void>
  unmount?: () => void | Promise<void>
  execute: (input: Input, scope: any) => Promise<Output>
}
