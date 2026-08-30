import { branchTTL, createNode } from './factory'
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

  public constructor (node: syntax.Node, endpoints: EndpointsFactory, directives: DirectiveFactory) {
    this.endpoints = endpoints
    this.directives = directives
    this.root = node
    this.trunk = this.createNode(node, PROTECTED)
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

  public merge (node: syntax.Node, extension: unknown): Node[] {
    const branch = this.createNode(node, !PROTECTED, extension)

    return this.trunk.merge(branch)
  }

  /**
   * Extends the expiration of an already merged branch, leaving its endpoints
   * and their remotes intact.
   */
  public refresh (nodes: Node[]): void {
    const expiration = Date.now() + branchTTL()

    for (const node of nodes)
      node.touch(expiration)
  }

  public dispose (): void {
    this.directives.dispose()
  }

  private createNode (node: syntax.Node, protect: boolean, extension?: unknown): Node {
    const context: Context = {
      protected: protect,
      endpoints: this.endpoints,
      directives: {
        factory: this.directives,
        stack: this.root.directives ?? []
      },
      path: label(extension),
      extension
    }

    return createNode(node, context)
  }
}

/**
 * A branch's routes are relative to wherever it is merged, and the mount point is not
 * known while it is being built — so the component it came from is what keeps two
 * branches from looking like the same route.
 */
function label (extension: unknown): string {
  if (extension === null || typeof extension !== 'object')
    return ''

  const { namespace, component } = extension as Record<string, unknown>

  return typeof namespace === 'string' && typeof component === 'string'
    ? `${namespace}.${component}`
    : ''
}

const PROTECTED = true
