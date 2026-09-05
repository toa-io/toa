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

  /** What this method is published as, which is what the nearest declaration says. */
  public static published (directives: Tool[] | undefined): Tool | null {
    return directives?.[0] ?? null
  }

  // eslint-disable-next-line max-params
  public create (name: string, value: unknown, _: unknown, route: string): Tool {
    assert.ok(name === 'tool', `Unknown directive: mcp:${name}`)

    return new Tool(value, route)
  }

  /** What the route states this method is, which is the only thing that states it. */
  public explain (directives: Tool[], _: Context,
    introspection: Introspection): Introspection {
    const tool = MCP.published(directives)

    return tool === null ? introspection : { ...introspection, description: tool.description }
  }
}
