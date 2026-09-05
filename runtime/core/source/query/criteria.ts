import { parse } from '@rsql/parser'
import { QuerySyntaxException } from '../exceptions.js'
import type { Node } from '../types/storages.js'

/** What a component declares about the properties a criteria may select on. */
export type Properties = Record<string, { type: string }>

export function criteria (expression: string, properties?: Properties): Node {
  let ast: Node

  try {
    ast = parse(expression) as unknown as Node
  } catch (e) {
    throw new QuerySyntaxException((e as Error).message)
  }

  if (properties !== undefined) coerce(ast, properties)

  return ast
}

function coerce (node: Node, properties: Properties): void {
  if (node.type === 'COMPARISON' && node.left?.type === 'SELECTOR' &&
    node.right?.type === 'VALUE') {
    const selector = node.left.selector as string
    const property = properties[selector]

    if (property === undefined) {
      throw new QuerySyntaxException(`Criteria selector '${selector}' is not defined`)
    }

    const cast = COERCE[property.type]

    // `=in=` and `=out=` carry a list, and coercing that as one value gives whatever
    // `parseInt` makes of a comma-separated string
    if (cast !== undefined)
      node.right.value = Array.isArray(node.right.value)
        ? node.right.value.map((value: string) => cast(value))
        : cast(node.right.value as string)
  } else {
    if (node.left !== undefined) coerce(node.left, properties)
    if (node.right !== undefined) coerce(node.right, properties)
  }
}

const COERCE: Record<string, (value: string) => unknown> = {
  number: Number.parseFloat,
  integer: Number.parseInt,
  boolean: (value: string) => value === 'true'
}
