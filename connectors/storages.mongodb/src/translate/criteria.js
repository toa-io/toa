'use strict'

const { rename } = require('./rename')

const criteria = (node) => {
  if (!TYPES[node.type]) { throw new Error('Query criteria AST parse error') }

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

  return { [left]: { [OPERATORS.COMPARISON[expression.operator]]: right } }
}

TYPES.SELECTOR = (expression) => rename(expression.selector)
TYPES.VALUE = (expression) => expression.value

exports.criteria = criteria
