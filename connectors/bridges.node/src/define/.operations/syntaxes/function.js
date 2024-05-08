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
  else definition.scope = 'none'

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

function scope (name) {
  if (scopes.includes(name))
    return name

  if (name === 'context')
    return 'none'

  return undefined
}

const nodes = ['FunctionDeclaration', 'ArrowFunctionExpression', 'ClassMethod']

exports.define = define
exports.test = test
