import { Operation } from '@toa.io/norm/types'
import { Node, Statement } from '@babel/types'
import * as _bridges from '@toa.io/core/types/bridges'
import * as _core from '@toa.io/core/types'
import * as _context from './context'

declare namespace toa.node.define {

  namespace algorithms {
    type Definition = Partial<Operation>

    type List = Record<string, Definition>

    type Syntax = 'function' | 'class' | 'factory'

    type Descriptor = {
      name: string
      statement: Statement
      syntax: Syntax
    }

    type Define = (descriptor: Descriptor) => Definition

    type Test = (node: Node, type: string) => boolean

    type func = (input?: any, scope?: object | object[], context?: _context.Context) => Promise<_core.Reply>

    type Constructor = (func: func, context: _context.Context) => _bridges.Algorithm
  }

  type Algorithms = (root: string) => Promise<algorithms.List>

}
