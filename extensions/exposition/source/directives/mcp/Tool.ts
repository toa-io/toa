import assert from 'node:assert'
import type { Introspection } from '../../Introspection.js'

/**
 * What makes a method a tool. A component describes its operations whether or not an
 * application means to hand them to a model, so saying so is what exposes one.
 *
 * `true` takes the operation's own description. A string replaces it, for one operation
 * mounted twice where the route is what makes the two different.
 */
export class Tool {
  private readonly description: string | null

  public constructor (value: unknown) {
    assert.ok(typeof value === 'string' || value === true,
      '`mcp:tool` must be a description, or `true` to take the operation\'s own')

    this.description = value === true ? null : value as string
  }

  /** What the tool is described as, or nothing where neither the route nor the operation says. */
  public describes (introspection: Introspection): string | undefined {
    return this.description ?? introspection.description
  }
}
