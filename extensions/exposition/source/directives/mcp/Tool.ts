import { refusal } from '../../RPC/names.ts'
import { segment } from '../../RTD/segment.ts'

/**
 * Whether one method is published to a model. Declaring it is what publishes it, and it
 * says nothing else — what a tool is, is [`help:method`](../help/Help.ts), which is what
 * describes the method to everything else as well.
 *
 * `false` withdraws one: the declaration is inherited, as every directive is, and a node
 * publishing what is under it is how a subtree is published at all.
 */
export class Tool {
  public readonly published: boolean

  public constructor(value: unknown, route: string) {
    if (typeof value !== 'boolean')
      throw new Error(
        'Directive mcp:tool: the value is whether the method is published; what it is, is `help:method`'
      )

    // a tool is called by name, so a route that cannot be named cannot be one — said where
    // the mistake is, rather than as a tool that is quietly never listed
    if (value)
      if (refusal(segment(route)) !== null)
        throw new Error(
          `Directive mcp:tool: '${route}' holds a segment no tool name can spell`
        )

    this.published = value
  }
}
