import { Operation } from '@toa.io/norm/types'
import { Node, Statement } from '@babel/types'
import * as _context from './context'
import * as _algorithm from './algorithms'

declare namespace toa.node.define{

  namespace algorithms{
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

    type Constructor = (func: _algorithm.func, context: _context.Context) => _algorithm.Algorithm
  }

  type Algorithms = (root: string) => Promise<algorithms.List>

}
