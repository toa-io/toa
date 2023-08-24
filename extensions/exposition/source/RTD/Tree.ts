import { type Node } from './Node'
import { createNode } from './factory'
import { fragment } from './segment'
import { type Match, type Parameter } from './Match'
import { type MethodFactory } from './Method'
import { type Context } from './Context'
import type * as syntax from './syntax'

export class Tree<TMethod> {
  private readonly trunk: Node<TMethod>
  private readonly methods: MethodFactory<TMethod>

  public constructor (node: syntax.Node, methods: MethodFactory) {
    this.methods = methods
    this.trunk = this.createNode(node, PROTECTED)
  }

  public match (path: string): Match<TMethod> | null {
    const fragments = fragment(path)
    const parameters: Parameter[] = []
    const node = this.trunk.match(fragments, parameters)

    if (node === null) return null
    else return { node, parameters }
  }

  public merge (node: syntax.Node, extension: any): void {
    const branch = this.createNode(node, !PROTECTED, extension)

    this.trunk.merge(branch)
  }

  private createNode (node: syntax.Node, protect: boolean, extension?: any): Node<TMethod> {
    const context: Context = {
      protected: protect,
      methods: this.methods,
      extension
    }

    return createNode(node, context)
  }
}

const PROTECTED = true
