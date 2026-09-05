import assert from 'node:assert'
import { Tool } from './Tool.js'
import type { Context } from '../../HTTP/index.js'
import type { Introspection } from '../../Introspection.js'
import type { DirectiveFamily } from '../../RTD/index.js'

/** The name the family is declared under, and what `MCP` asks a method for. */
export const FAMILY = 'mcp'

export class MCP implements DirectiveFamily<Tool> {
  public readonly name = FAMILY
  public readonly mandatory = false

  // eslint-disable-next-line max-params
  public create (name: string, value: unknown, _: unknown, route: string): Tool {
    assert.ok(name === 'tool', `Unknown directive: mcp:${name}`)

    return new Tool(value, route)
  }

  /** What this method is published as, which is what the nearest declaration says. */
  public static published (directives: Tool[] | undefined): Tool | null {
    const nearest = directives?.[0]

    return nearest === undefined || !nearest.published ? null : nearest
  }

  /**
   * The nearest declaration wins, which is what an override on a method means against one
   * inherited from the node above it. A declaration that describes nothing leaves the
   * operation's own description standing.
   */
  public explain (directives: Tool[], _: Context,
    introspection: Introspection): Introspection {
    const description = MCP.published(directives)?.description

    return description === undefined ? introspection : { ...introspection, description }
  }
}
