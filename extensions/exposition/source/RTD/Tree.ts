import { createNode } from './factory'
import { fragment } from './segment'
import type { Node } from './Node'
import type { Match } from './Match'
import type { Context } from './Context'
import type { DirectiveFactory } from './Directives'
import type { EndpointsFactory } from './Endpoint'
import type * as syntax from './syntax'

export class Tree {
  private readonly root: syntax.Node
  private readonly trunk: Node
  private readonly endpoints: EndpointsFactory
  private readonly directives: DirectiveFactory

  public constructor
  (node: syntax.Node, endpoints: EndpointsFactory, directives: DirectiveFactory) {
    this.endpoints = endpoints
    this.directives = directives
    this.trunk = this.createNode(node, PROTECTED)
    this.root = node
  }

  public match (path: string): Match | null {
    if (path === '/')
      return {
        node: this.trunk,
        parameters: []
      }

    const fragments = fragment(path)

    return this.trunk.match(fragments)
  }

  public merge (node: syntax.Node, extension: unknown): void {
    const branch = this.createNode(node, !PROTECTED, extension)

    this.trunk.merge(branch)
  }

  private createNode
  (node: syntax.Node, protect: boolean, extension?: unknown): Node {
    const context: Context = {
      protected: protect,
      endpoints: this.endpoints,
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
