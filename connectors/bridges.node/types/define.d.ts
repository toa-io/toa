import { Operation } from '@toa.io/norm/types'
import { Node } from '@babel/types'

declare namespace toa.node.define {

  namespace operations {
    type Definition = Partial<Operation>

    type List = Record<string, Definition>

    type Define = (node: Node, type: string) => Definition
  }

  type Operations = (root: string) => Promise<operations.List>

}
