'use strict'

const { letters: { capitalize } } = require('@toa.io/libraries/generic')
const { types } = require('./constants')
const func = require('./function')

/** @type {toa.node.define.operations.Define} */
const define = (statement, name) => {
  if (!test(statement, name)) return null

  const type = name.toLowerCase()
  const run = method(/** @type {import('@babel/types').ClassDeclaration} */ statement, 'run')

  return func.define(run, type)
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
 */
const method = (statement, name) => {
  const methods = statement.body.body
  const method = methods.find((method) => method.type === 'ClassMethod' && method.key.name === name)

  if (method === undefined) throw new Error(`Method '${name}' not found`)

  return method
}

const names = types.map((type) => capitalize(type))

exports.define = define
exports.test = test
