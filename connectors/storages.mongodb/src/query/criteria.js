'use strict'

const { LOGIC, COMPARISON } = require('./map')

const criteria = (ast) => {
  if (!OPERATORS[ast.type]) { throw new Error('AST parse error') }

  return OPERATORS[ast.type](ast)
}

const OPERATORS = {}

OPERATORS.LOGIC = (expression) => {
  const left = criteria(expression.left)
  const right = criteria(expression.right)

  return { [LOGIC[expression.operator]]: [left, right] }
}

OPERATORS.COMPARISON = (expression) => {
  const left = criteria(expression.left)
  const right = criteria(expression.right)

  return { [left]: { [COMPARISON[expression.operator]]: right } }
}

OPERATORS.SELECTOR = (expression) => expression.selector
OPERATORS.VALUE = (expression) => expression.value

exports.criteria = criteria
