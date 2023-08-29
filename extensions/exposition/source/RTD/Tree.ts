import { type Node } from './Node'
import { createNode } from './factory'
import { fragment } from './segment'
import { type Match, type Parameter } from './Match'
import { type MethodFactory } from './Method'
import { type Context } from './Context'
import { type Directives, type DirectivesFactory } from './Directives'
import type * as syntax from './syntax'

export class Tree<IMethod, IDirectives extends Directives<IDirectives>> {
  private readonly root: syntax.Node
  private readonly trunk: Node<IMethod>
  private readonly methods: MethodFactory<IMethod>
  private readonly directives: DirectivesFactory

  public constructor (node: syntax.Node, methods: MethodFactory, directives: DirectivesFactory) {
    this.methods = methods
    this.directives = directives
    this.trunk = this.createNode(node, PROTECTED)
    this.root = node
  }

  public match (path: string): Match<IMethod, IDirectives> | null {
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

  private createNode (node: syntax.Node, protect: boolean, extension?: any): Node {
    const context: Context = {
      protected: protect,
      methods: this.methods,
      directives: {
        factory: this.directives,
        stack: this.root?.directives ?? []
      },
      extension
    }

    return createNode(node, context)
  }
}

const PROTECTED = true
