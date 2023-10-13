'use strict'

const { types, scopes } = require('./constants')

/** @type {toa.node.define.operations.Define} */
const define = (descriptor) => {
  const { statement, name } = descriptor
  const node = statement.type === 'ExpressionStatement' ? statement.expression : statement

  /** @type {toa.node.define.operations.Definition} */
  const definition = {}

  definition.type = name

  if (node.params.length > 1) definition.scope = scope(node.params[1].name)
  if (node.params.length === 0) definition.input = null

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
 * @returns {string}
 */
const scope = (name) => scopes.includes(name) ? name : undefined

const nodes = ['FunctionDeclaration', 'ArrowFunctionExpression', 'ClassMethod']

exports.define = define
exports.test = test
