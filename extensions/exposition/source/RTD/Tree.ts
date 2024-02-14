import { type Node } from './Node'
import { createNode } from './factory'
import { fragment } from './segment'
import { type Match } from './Match'
import { type Context } from './Context'
import { type Directives, type DirectivesFactory } from './Directives'
import { type Endpoint, type EndpointsFactory } from './Endpoint'
import type * as syntax from './syntax'

export class Tree<
  TEndpoint extends Endpoint<TEndpoint> = any,
  TDirectives extends Directives<TDirectives> = any
> {
  private readonly root: syntax.Node
  private readonly trunk: Node<TEndpoint, TDirectives>
  private readonly endpoints: EndpointsFactory<TEndpoint>
  private readonly directives: DirectivesFactory

  public constructor
  (node: syntax.Node, endpoints: EndpointsFactory, directives: DirectivesFactory) {
    this.endpoints = endpoints
    this.directives = directives
    this.trunk = this.createNode(node, PROTECTED)
    this.root = node
  }

  public match (path: string): Match<TEndpoint, TDirectives> | null {
    if (path === '/')
      return { node: this.trunk, parameters: [] }

    const fragments = fragment(path)

    return this.trunk.match(fragments)
  }

  public merge (node: syntax.Node, extension: any): void {
    const branch = this.createNode(node, !PROTECTED, extension)

    this.trunk.merge(branch)
  }

  private createNode (node: syntax.Node, protect: boolean, extension?: any): Node {
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
