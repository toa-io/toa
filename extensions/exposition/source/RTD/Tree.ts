import { console } from 'openspan'
import { refusal, template } from '../RPC/names.js'
import { branchTTL, createNode } from './factory.js'
import { fragment } from './segment.js'
import type { Mount, Node } from './Node.js'
import type { Match } from './Match.js'
import type { Context } from './Context.js'
import type { DirectiveFactory } from './Directives.js'
import type { EndpointsFactory } from './Endpoint.js'
import type * as syntax from './syntax/index.js'

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

    unnameable(this.trunk)
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

  /** Every method in the tree, with the template it answers at. */
  public walk (): Generator<Mount> {
    return this.trunk.walk([], TRUNK)
  }

  public merge (node: syntax.Node, extension: unknown): Node[] {
    const branch = this.createNode(node, !PROTECTED, extension)

    unnameable(branch)

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
        // A merged branch is mounted under the root, so it inherits the root's
        // directives. The trunk is the root: createNode adds them itself, and
        // seeding them here too would apply every one of them twice.
        stack: node === this.root ? [] : this.root.directives ?? []
      },
      path: label(extension),
      extension
    }

    return createNode(node, context)
  }
}

/**
 * What is served but cannot be called by name. Said once per route as it is built, because a
 * procedure that is missing is otherwise noticed only by the caller who cannot find it.
 */
function unnameable (node: Node): void {
  const said = new Set<string>()

  for (const { segments } of node.walk([], TRUNK)) {
    const segment = refusal(segments)

    if (segment === null)
      continue

    const route = template(segments)

    if (said.has(route))
      continue

    said.add(route)

    console.warn('Route cannot be addressed as a procedure', { route, segment })
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
const TRUNK = true
