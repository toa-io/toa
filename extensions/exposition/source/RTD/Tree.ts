import { console } from 'openspan'
import { refusal, template } from '../RPC/names.ts'
import { DISCOVERY } from '@toa.io/definitions/extensions.exposition'
import { branchTTL, createNode } from './factory.ts'
import { fragment } from './segment.ts'
import type { Mount, Node } from './Node.ts'
import type { Match } from './Match.ts'
import type { Context } from './Context.ts'
import type { DirectiveFactory } from './Directives.ts'
import type { EndpointsFactory } from './Endpoint.ts'
import type * as syntax from './syntax/index.ts'

export class Tree {
  private readonly root: syntax.Node
  private readonly trunk: Node
  private readonly endpoints: EndpointsFactory
  private readonly directives: DirectiveFactory

  /** What has been read off the whole tree. See `derived`. */
  private readonly memo = new Map<string, unknown>()

  public constructor(
    node: syntax.Node,
    endpoints: EndpointsFactory,
    directives: DirectiveFactory
  ) {
    this.endpoints = endpoints
    this.directives = directives
    this.root = node
    this.trunk = this.createNode(node, PROTECTED)

    announce(this.trunk)
  }

  public match(path: string): Match | null {
    if (path === '/')
      return {
        node: this.trunk,
        parameters: [],
        route: '/'
      }

    const fragments = fragment(path)

    return this.trunk.match(fragments)
  }

  /** Every method in the tree, with the template it answers at. */
  public walk(): Generator<Mount> {
    return this.trunk.walk([], TRUNK)
  }

  /**
   * What is read off the whole tree rather than off one route — the tools it publishes, the
   * page that lists it — built on demand and dropped whole when a branch is merged. A merge
   * is the only thing that changes what the tree holds; a branch that expires stops being
   * walked, so what is derived from it says so by carrying the node it came from.
   *
   * Nothing that depends on the caller belongs here: the tree is one, and its callers are
   * not.
   */
  public derived<T>(key: string, build: () => T): T {
    if (!this.memo.has(key)) this.memo.set(key, build())

    return this.memo.get(key) as T
  }

  public merge(node: syntax.Node, extension: unknown): Node[] {
    const branch = this.createNode(node, !PROTECTED, extension)

    announce(branch)

    this.memo.clear()

    return this.trunk.merge(branch)
  }

  /**
   * Extends the expiration of an already merged branch, leaving its endpoints
   * and their remotes intact.
   */
  public refresh(nodes: Node[]): void {
    const expiration = Date.now() + branchTTL()

    for (const node of nodes) node.touch(expiration)
  }

  public dispose(): void {
    this.directives.dispose()
  }

  private createNode(node: syntax.Node, protect: boolean, extension?: unknown): Node {
    const context: Context = {
      protected: protect,
      endpoints: this.endpoints,
      directives: {
        factory: this.directives,
        // A merged branch is mounted under the root, so it inherits the root's
        // directives. The trunk is the root: createNode adds them itself, and
        // seeding them here too would apply every one of them twice.
        stack: node === this.root ? [] : (this.root.directives ?? [])
      },
      path: label(extension),
      extension
    }

    return createNode(node, context)
  }
}

/**
 * What is served but cannot be reached as it reads. Said once per route as it is built,
 * because either of these is otherwise noticed only by the caller who cannot find it.
 */
function announce(node: Node): void {
  const said = new Set<string>()

  for (const { segments } of node.walk([], TRUNK)) {
    const route = template(segments)

    if (said.has(route)) continue

    // the page is served under this prefix, before a request is routed at all
    if (route === DISCOVERY || route.startsWith(DISCOVERY + '/')) {
      said.add(route)

      console.warn('Route is shadowed by the discovery endpoint', { route })

      continue
    }

    const segment = refusal(segments)

    if (segment === null) continue

    said.add(route)

    console.warn('Route cannot be addressed as a procedure', { route, segment })
  }
}

/**
 * A branch's routes are relative to wherever it is merged, and the mount point is not
 * known while it is being built — so the component it came from is what keeps two
 * branches from looking like the same route.
 */
function label(extension: unknown): string {
  if (extension === null || typeof extension !== 'object') return ''

  const { namespace, component } = extension as Record<string, unknown>

  return typeof namespace === 'string' && typeof component === 'string'
    ? `${namespace}.${component}`
    : ''
}

const PROTECTED = true
const TRUNK = true
