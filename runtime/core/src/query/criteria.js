import { parse } from '@rsql/parser'
import { QuerySyntaxException } from '../exceptions.js'

export const criteria = (criteria, properties) => {
  let ast

  try {
    ast = parse(criteria)
  } catch (e) {
    throw new QuerySyntaxException(e.message)
  }

  if (properties !== undefined) coerce(ast, properties)

  return ast
}

const coerce = (node, properties) => {
  if (node.type === 'COMPARISON' && node.left?.type === 'SELECTOR' && node.right?.type === 'VALUE') {
    const property = properties[node.left.selector]

    if (property === undefined) {
      throw new QuerySyntaxException(`Criteria selector '${node.left.selector}' is not defined`)
    }

    const coerce = COERCE[property.type]

    // `=in=` and `=out=` carry a list, and coercing that as one value gives whatever
    // `parseInt` makes of a comma-separated string
    if (coerce !== undefined)
      node.right.value = Array.isArray(node.right.value)
        ? node.right.value.map((value) => coerce(value))
        : coerce(node.right.value)
  } else {
    if (node.left !== undefined) coerce(node.left, properties)
    if (node.right !== undefined) coerce(node.right, properties)
  }
}

const COERCE = {
  number: Number.parseFloat,
  integer: Number.parseInt,
  boolean: (value) => value === 'true'
}
