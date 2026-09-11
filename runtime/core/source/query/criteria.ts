import { parse } from '@rsql/parser'
import { QuerySyntaxException } from '../exceptions.ts'
import type { Node } from '../types/storages.ts'

/** What a component declares about the properties a criteria may select on. */
export type Properties = Record<string, { type: string }>

export function criteria(expression: string, properties?: Properties): Node {
  let ast: Node

  try {
    ast = parse(expression) as unknown as Node
  } catch (e) {
    throw new QuerySyntaxException((e as Error).message)
  }

  if (properties !== undefined) read(ast, properties)

  return ast
}

function read(node: Node, properties: Properties): void {
  if (
    node.type === 'COMPARISON' &&
    node.left?.type === 'SELECTOR' &&
    node.right?.type === 'VALUE'
  ) {
    const selector = node.left.selector as string
    const property = properties[selector]

    if (property === undefined) {
      throw new QuerySyntaxException(`Criteria selector '${selector}' is not defined`)
    }

    const cast = CAST[property.type]

    // `=in=` and `=out=` carry a list, and casting that as one value gives whatever
    // a comma-separated string reads as
    if (cast !== undefined)
      node.right.value = Array.isArray(node.right.value)
        ? node.right.value.map((value: string) => cast(value, selector))
        : cast(node.right.value as string, selector)
  } else {
    if (node.left !== undefined) read(node.left, properties)
    if (node.right !== undefined) read(node.right, properties)
  }
}

/**
 * A criteria arrives as text, so a value is read as what the property it selects on holds. What
 * cannot be read as that is refused rather than passed on: `parseInt` answers `NaN` for a word
 * and `12` for `12kg`, and a storage asked to match either finds nothing and says nothing —
 * a mistyped filter reads as an empty result.
 *
 * A string is left as it came, because every text is one: what a criteria may compare a string
 * to is not the type's to say.
 */
const CAST: Record<string, (value: string, selector: string) => unknown> = {
  number: (value, selector) => finite(value, selector, 'a number'),

  integer: (value, selector) => {
    const number = finite(value, selector, 'an integer')

    if (!Number.isInteger(number)) refuse(selector, 'an integer', value)

    return number
  },

  boolean: (value, selector) => {
    if (value === 'true') return true
    if (value === 'false') return false

    return refuse(selector, 'a boolean', value)
  }
}

function finite(value: string, selector: string, expected: string): number {
  // `Number` reads a blank string as zero, and a criteria that says nothing says nothing
  const number = value.trim() === '' ? Number.NaN : Number(value)

  if (!Number.isFinite(number)) refuse(selector, expected, value)

  return number
}

function refuse(selector: string, expected: string, value: string): never {
  throw new QuerySyntaxException(
    `Criteria selector '${selector}' takes ${expected}, and '${value}' is not one`
  )
}
