import { type Node } from './Node'
import { createNode } from './factory'
import { fragment } from './segment'
import { type Match, type Parameter } from './Match'
import { type Context } from './Context'
import { type Directives, type DirectivesFactory } from './Directives'
import { type Endpoint, type EndpointsFactory } from './Endpoint'
import type * as syntax from './syntax'

export class Tree<
  IEndpoint extends Endpoint<IEndpoint> = any,
  IDirectives extends Directives<IDirectives> = any
> {
  private readonly root: syntax.Node
  private readonly trunk: Node<IEndpoint, IDirectives>
  private readonly endpoints: EndpointsFactory<IEndpoint>
  private readonly directives: DirectivesFactory

  public constructor
  (node: syntax.Node, endpoints: EndpointsFactory, directives: DirectivesFactory) {
    this.endpoints = endpoints
    this.directives = directives
    this.trunk = this.createNode(node, PROTECTED)
    this.root = node
  }

  public match (path: string): Match<IEndpoint, IDirectives> | null {
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
