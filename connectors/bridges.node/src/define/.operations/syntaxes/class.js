'use strict'

const { letters: { capitalize } } = require('@toa.io/libraries/generic')
const { types } = require('./constants')
const func = require('./function')

/** @type {toa.node.define.operations.Define} */
const define = (descriptor) => {
  const declaration = /** @type {import('@babel/types').ClassDeclaration} */ descriptor.statement

  descriptor.name = descriptor.name.toLowerCase()
  descriptor.statement = method(declaration, 'run')

  return func.define(descriptor)
}

/** @type {toa.node.define.operations.Test} */
const test = (statement, name) => {
  const declaration = statement.type === 'ClassDeclaration'
  const known = names.includes(name)

  return declaration && known
}

/**
 * @param {import('@babel/types').ClassDeclaration} statement
 * @param {string} name
 * @returns {import('@babel/types').Statement}
 */
const method = (statement, name) => {
  const methods = statement.body.body
  const method = methods.find((method) => method.type === 'ClassMethod' && method.key.name === name)

  if (method === undefined) throw new Error(`Method '${name}' not found`)

  return /** @type {import('@babel/types').Statement} */ method
}

const names = types.map((type) => capitalize(type))

exports.define = define
exports.test = test
