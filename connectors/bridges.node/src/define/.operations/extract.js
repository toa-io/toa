import * as parser from '@babel/parser'
import * as syntaxes from './syntaxes/index.js'

/**
 * @param {Object} module
 * @returns {toa.node.define.algorithms.Descriptor}
 */
const extract = (module) => {
  const entry = find(module)

  if (entry === null)
    return null

  const [name, func] = entry
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
 * A module namespace enumerates its exports in sorted order rather than the order
 * they were written, so which one is meant has to be unambiguous.
 *
 * @param {Object} module
 * @returns [string, Function]
 */
const find = (module) => {
  const functions = Object.entries(module)
    .filter(([key, value]) => typeof value === 'function' && key !== '__esModule')

  if (functions.length === 0) return null
  if (functions.length === 1) {
    const [name, func] = functions[0]

    // `export default function transition` says its name in the function itself
    return name === 'default' ? [func.name, func] : functions[0]
  }

  const named = functions.filter(([key]) => key !== 'default')

  if (named.length === 1) return named[0]

  throw new Error('A module must export one algorithm, and this one exports ' +
    named.map(([key]) => `'${key}'`).join(', '))
}

/**
 * @param {Function} func
 * @returns {import('@babel/types').Statement}
 */
const parse = (func) => {
  // an operation is a module, and may say so with import.meta
  const file = parser.parse(func.toString(), { sourceType: 'module' })

  return file.program.body[0]
}

export { extract }
