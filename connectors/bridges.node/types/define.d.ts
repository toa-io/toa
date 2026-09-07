import { Operation } from '@toa.io/norm/types'
import * as _context from './context.js'
import * as _algorithm from './algorithms.js'

declare namespace toa.node.define {
  namespace algorithms {
    type Definition = Partial<Operation>

    type List = Record<string, Definition>

    type Syntax = 'function' | 'class' | 'factory'

    type Parameter = { name: string | undefined }

    type Method = { type: 'ClassMethod'; key: { name: string }; params: Parameter[] }

    /** What is read from an algorithm's source: the form it is declared in, and its parameters. */
    type Statement =
      | { type: 'FunctionDeclaration' | 'ArrowFunctionExpression'; params: Parameter[] }
      | { type: 'ClassDeclaration'; body: { body: Method[] } }

    type Node = Statement | Method

    type Descriptor = {
      name: string
      statement: Statement
      syntax: Syntax
    }

    type Define = (descriptor: Descriptor) => Definition

    type Test = (node: Node, type: string) => boolean

    type Constructor = (
      func: _algorithm.func,
      context: _context.Context
    ) => _algorithm.Algorithm
  }

  type Algorithms = (root: string) => Promise<algorithms.List>
}
