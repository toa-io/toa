'use strict'

const { rename } = require('./rename')

/**
 * @param {toa.core.storages.ast.Node} node
 * @returns {import('mongodb').Filter}
 */
const criteria = (node) => {
  if (TYPES[node.type] === undefined) throw new Error(`AST parse error: unknown node type '${node.type}'`)

  return TYPES[node.type](node)
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

TYPES.LOGIC = (expression) => {
  const left = criteria(expression.left)
  const right = criteria(expression.right)

  return { [OPERATORS.LOGIC[expression.operator]]: [left, right] }
}

TYPES.COMPARISON = (expression) => {
  const left = criteria(expression.left)
  const right = criteria(expression.right)
  const operator = OPERATORS.COMPARISON[expression.operator]

  if (operator === undefined) throw new Error(`AST parse error: unknown operator '${expression.operator}'`)

  return { [left]: { [operator]: right } }
}

TYPES.SELECTOR = (expression) => rename(expression.selector)
TYPES.VALUE = (expression) => expression.value

exports.criteria = criteria
