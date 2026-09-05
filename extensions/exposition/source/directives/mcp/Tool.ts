import assert from 'node:assert'
import { refusal } from '../../RPC/names.js'
import { segment } from '../../RTD/segment.js'

/**
 * What one method is, published to a model. `true` takes the operation's own description;
 * a string replaces it, for the case the operation cannot speak to — one operation mounted
 * on two routes, where the route is what makes the two different. `false` publishes nothing,
 * which is how a method opts out of what the node above it declared.
 */
export class Tool {
  public readonly published: boolean

  /** what the route says this is, or nothing where it defers to the operation */
  public readonly description: string | undefined

  public constructor (value: unknown, route: string) {
    if (typeof value === 'string') {
      assert.ok(value.trim().length > 0, 'Directive mcp:tool: a description cannot be empty')

      this.published = true
      this.description = value
    } else {
      assert.ok(typeof value === 'boolean',
        'Directive mcp:tool: the value is a description, or whether there is a tool at all')

      this.published = value
    }

    if (this.published)
      // a tool is called by name, so a route that cannot be named cannot be one — said
      // where the mistake is, rather than as a tool that is quietly never listed
      assert.ok(refusal(segment(route)) === null,
        `Directive mcp:tool: '${route}' holds a segment no tool name can spell`)
  }
}
