'use strict'

const parser = require('@babel/parser')
const syntaxes = require('./syntaxes')

/**
 * @param {Object} module
 * @returns {toa.node.define.algorithms.Descriptor}
 */
const extract = (module) => {
  const [name, func] = find(module)
  const statement = parse(func)

  /** @type {toa.node.define.algorithms.Descriptor} */
  const descriptor = { name, statement, syntax: undefined }

  for (const [syntax, { test }] of Object.entries(syntaxes)) {
    if (test(statement, name)) descriptor.syntax = /** @type {toa.node.define.algorithms.Syntax} */ syntax
  }

  if (descriptor.syntax === undefined) throw new Error('Exported function does not match conventions')

  return descriptor
}

/**
 * @param {Object} module
 * @returns [string, Function]
 */
const find = (module) => {
  for (const [key, value] of Object.entries(module)) {
    if (typeof value === 'function') return [key, value]
  }

  throw new Error('Module does not export function')
}

/**
 * @param {Function} func
 * @returns {import('@babel/types').Statement}
 */
const parse = (func) => {
  const file = parser.parse(func.toString())

  return file.program.body[0]
}

exports.extract = extract
