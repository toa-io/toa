import { Tool } from './Tool.js'
import type * as http from '../../HTTP/index.js'
import type { Introspection } from '../../Introspection.js'
import type { DirectiveFamily } from '../../RTD/index.js'

/**
 * What an application hands to a model. It changes nothing about a request: a tool is called
 * as the method it is, under the same directives, and this only says which methods are ones.
 */
export class Model implements DirectiveFamily<Tool> {
  public readonly name = 'mcp'
  public readonly mandatory = false

  public create (name: string, value: unknown): Tool {
    if (name !== 'tool')
      throw new Error(`Directive 'mcp:${name}' is not implemented`)

    return new Tool(value)
  }

  /** A method that is a tool says so where it describes itself, and is listed from there. */
  public explain (directives: Tool[], _: http.Context,
    introspection: Introspection): Introspection {
    for (const directive of directives) {
      const description = directive.describes(introspection)

      if (description === undefined)
        throw new Error('`mcp:tool` states no description, and neither does its operation')

      introspection.tool = description
    }

    return introspection
  }
}
