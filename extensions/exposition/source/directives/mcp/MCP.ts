import { Tool } from './Tool.js'
import type { DirectiveFamily } from '../../RTD/index.js'
import type { Context } from '../../HTTP/index.js'
import type { Introspection } from '../../Introspection.js'

/** The name the family is declared under, and what `MCP` asks a method for. */
export const FAMILY = 'mcp'

export class MCP implements DirectiveFamily<Tool> {
  public readonly name = FAMILY
  public readonly mandatory = false

  /** Whether this method is published, which is what the nearest declaration says. */
  public static published(directives: Tool[] | undefined): boolean {
    return directives?.[0]?.published ?? false
  }

  /**
   * Whether this method is published to a model, which is what the route declares. Whether
   * one is served at all is the annotation's, and a route says nothing of that.
   */
  public explain(
    directives: Tool[],
    _: Context,
    introspection: Introspection
  ): Introspection {
    return MCP.published(directives) ? { ...introspection, mcp: true } : introspection
  }

  // eslint-disable-next-line max-params
  public create(name: string, value: unknown, _: unknown, route: string): Tool {
    if (name !== 'tool') throw new Error(`Unknown directive: mcp:${name}`)

    return new Tool(value, route)
  }
}
