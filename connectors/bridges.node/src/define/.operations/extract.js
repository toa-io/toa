'use strict'

const parser = require('@babel/parser')

/**
 * @param {Object} module
 * @returns {[string, import('@babel/types').Statement]}
 */
const extract = (module) => {
  const [name, func] = find(module)
  const ast = parse(func)

  return [name, ast]
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
