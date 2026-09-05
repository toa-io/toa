import assert from 'node:assert'
import { refusal } from '../../RPC/names.js'
import { segment } from '../../RTD/segment.js'

/**
 * What one method is, published to a model. Declaring it is what publishes it, and what it
 * says is what it says it is: a tool a model cannot read the purpose of is one it cannot
 * choose, so there is no way to publish one that states nothing.
 *
 * A `title` is what a person is shown where a client lists what it may call — a name is an
 * address and reads as one. A description alone is written as the value; both are written as
 * a mapping.
 *
 * The operation states what it is too, and that is not this. An operation is written without
 * knowledge of any route, and a tool is an operation and a route together — the same
 * operation mounted twice is two tools, and one sentence is not true of both.
 */
export class Tool {
  public readonly description: string
  public readonly title: string | undefined

  public constructor (value: unknown, route: string) {
    const stated = typeof value === 'string' ? { description: value } : value

    assert.ok(typeof stated === 'object' && stated !== null && !Array.isArray(stated),
      'Directive mcp:tool: the value is what the tool is, or a `title` and a `description`')

    const { description, title, ...rest } = stated as Record<string, unknown>

    assert.ok(Object.keys(rest).length === 0,
      `Directive mcp:tool: unknown ${Object.keys(rest).map((key) => `'${key}'`).join(', ')}`)

    assert.ok(typeof description === 'string' && description.trim().length > 0,
      'Directive mcp:tool: a description cannot be empty')

    assert.ok(title === undefined || (typeof title === 'string' && title.trim().length > 0),
      'Directive mcp:tool: a title cannot be empty')

    // a tool is called by name, so a route that cannot be named cannot be one — said where
    // the mistake is, rather than as a tool that is quietly never listed
    assert.ok(refusal(segment(route)) === null,
      `Directive mcp:tool: '${route}' holds a segment no tool name can spell`)

    this.description = description
    this.title = title as string | undefined
  }
}
