'use strict'

const { types, subjects } = require('./constants')

/** @type {toa.node.define.operations.Define} */
const define = (statement, type) => {
  const node = statement.type === 'ExpressionStatement' ? statement.expression : statement

  if (!nodes.includes(node.type)) return null
  if (!types.includes(type)) return null

  /** @type {toa.node.define.operations.Definition} */
  const definition = {}

  definition.type = /** @type {typeof toa.norm.component.Operation.type} */ type

  if (node.params.length > 1) definition.subject = subject(node.params[1].name)

  return definition
}

/**
 * @param {string} name
 * @returns {typeof toa.norm.component.Operation.subject}
 */
const subject = (name) => subjects.includes(name) ? name : undefined

const nodes = ['FunctionDeclaration', 'ArrowFunctionExpression', 'ClassMethod']

exports.define = define
