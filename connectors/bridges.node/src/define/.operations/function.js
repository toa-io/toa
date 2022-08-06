'use strict'

const { types, subjects } = require('./constants')

/** @type {toa.node.define.operations.Define} */
const define = (statement, type) => {
  if (!test(statement, type)) return null

  const node = statement.type === 'ExpressionStatement' ? statement.expression : statement

  /** @type {toa.node.define.operations.Definition} */
  const definition = {}

  definition.type = /** @type {typeof toa.norm.component.Operation.type} */ type

  if (node.params.length > 1) definition.subject = subject(node.params[1].name)

  return definition
}

/** @type {toa.node.define.operations.Test} */
const test = (statement, type) => {
  const node = statement.type === 'ExpressionStatement' ? statement.expression : statement
  const func = nodes.includes(node.type)
  const known = types.includes(type)

  return func && known
}

/**
 * @param {string} name
 * @returns {typeof toa.norm.component.Operation.subject}
 */
const subject = (name) => subjects.includes(name) ? name : undefined

const nodes = ['FunctionDeclaration', 'ArrowFunctionExpression', 'ClassMethod']

exports.define = define
exports.test = test
