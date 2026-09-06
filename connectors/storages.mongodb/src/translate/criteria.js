import { rename } from './rename.js'

/**
 * @param {import('@toa.io/core/types').storages.Node} node
 * @param {string[]} dates properties held as BSON dates
 * @returns {import('mongodb').Filter}
 */
export const criteria = (node, dates = NONE) => {
  if (TYPES[node.type] === undefined)
    throw new Error(`AST parse error: unknown node type '${node.type}'`)

  return TYPES[node.type](node, dates)
}

const OPERATORS = {
  LOGIC: {
    and: '$and',
    ';': '$and',
    or: '$or',
    ',': '$or'
  },
  COMPARISON: {
    '==': '$eq',
    '>': '$gt',
    '>=': '$gte',
    '=in=': '$in',
    '<': '$lt',
    '<=': '$lte',
    '!=': '$ne',
    '=out=': '$nin'
  }
}

const TYPES = {}

TYPES.LOGIC = (expression, dates) => {
  const left = criteria(expression.left, dates)
  const right = criteria(expression.right, dates)

  return { [OPERATORS.LOGIC[expression.operator]]: [left, right] }
}

TYPES.COMPARISON = (expression, dates) => {
  const left = criteria(expression.left, dates)
  const right = criteria(expression.right, dates)
  const operator = OPERATORS.COMPARISON[expression.operator]

  if (operator === undefined)
    throw new Error(`AST parse error: unknown operator '${expression.operator}'`)

  // the record holds a date where the criterion carries the string the entity declares, and a
  // string compared against a date is a criterion that quietly matches nothing
  const value = dates.includes(left) ? date(right) : right

  return { [left]: { [operator]: value } }
}

TYPES.SELECTOR = (expression) => rename(expression.selector)
TYPES.VALUE = (expression) => expression.value

/** `=in=` and `=out=` carry a list, and every other operator one value. */
const date = (value) =>
  Array.isArray(value) ? value.map(date) : value === null ? null : new Date(value)

const NONE = []
