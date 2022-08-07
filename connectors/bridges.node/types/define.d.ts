import { Operation } from '@toa.io/norm/types'
import { Node, Statement } from '@babel/types'
import { bridges } from '@toa.io/core/types'
import * as context from './context'

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

    type Constructor = (func: Function, context: context.Context) => bridges.Algorithm
  }

  type Algorithms = (root: string) => Promise<algorithms.List>

}
