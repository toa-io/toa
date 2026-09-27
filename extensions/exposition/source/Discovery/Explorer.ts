import * as http from '../HTTP/index.ts'
import { BRANCH_TTL } from '@toa.io/definitions/extensions.exposition'
import { describe } from './tree.ts'
import type { Tree } from '../RTD/index.ts'
import type { Server as MCP } from '../MCP/index.ts'

/**
 * What an application serves, for every route at once. Each entry is what `OPTIONS` on that
 * path answers, so a key taken from here is a request that can be made.
 */
export class Explorer {
  private readonly tree: Tree

  /** Where a model is pointed, which is the tree's to say when it is not `/.mcp` beside it. */
  private readonly mcp: MCP | null

  public constructor(tree: Tree, mcp: MCP | null) {
    this.tree = tree
    this.mcp = mcp
  }

  public async process(context: http.Context): Promise<http.OutgoingMessage> {
    if (context.request.method !== 'OPTIONS')
      throw new http.MethodNotAllowed(new Headers({ allow: ALLOW }))

    const discovered = await describe(this.tree, context)
    const address = this.mcp?.address(context.authority) ?? null

    if (address !== null) discovered.mcp = address

    return {
      body: discovered,
      headers: new Headers({
        allow: ALLOW,
        // it stands until a branch expires, and it is filtered by who asked
        'cache-control': `private, max-age=${BRANCH_TTL / 1000}`,
        vary: 'authorization'
      })
    }
  }
}

/** The verbs of this path, which are not the verbs of the tree it answers with. */
const ALLOW = 'GET, HEAD, OPTIONS'
