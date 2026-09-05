import assert from 'node:assert'
import { refusal } from '../../RPC/names.js'
import { segment } from '../../RTD/segment.js'

/**
 * What one method is, published to a model. Declaring it is what publishes it, and what it
 * says is what it says it is: a tool a model cannot read the purpose of is one it cannot
 * choose, so there is no way to publish one that states nothing.
 *
 * The operation states what it is too, and that is not this. An operation is written without
 * knowledge of any route, and a tool is an operation and a route together — the same
 * operation mounted twice is two tools, and one sentence cannot be true of both.
 */
export class Tool {
  public readonly description: string

  public constructor (value: unknown, route: string) {
    assert.ok(typeof value === 'string' && value.trim().length > 0,
      'Directive mcp:tool: the value is what the tool is, which cannot be empty')

    // a tool is called by name, so a route that cannot be named cannot be one — said where
    // the mistake is, rather than as a tool that is quietly never listed
    assert.ok(refusal(segment(route)) === null,
      `Directive mcp:tool: '${route}' holds a segment no tool name can spell`)

    this.description = value
  }
}
