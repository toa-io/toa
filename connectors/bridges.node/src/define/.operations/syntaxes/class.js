import { letters } from '@toa.io/generic'
import { types } from './constants.js'
import * as func from './function.js'

const { capitalize } = letters

/** @type {toa.node.define.operations.Define} */
export const define = (descriptor) => {
  const declaration =
    /** @type {Extract<toa.node.define.algorithms.Statement, { type: 'ClassDeclaration' }>} */ (
      descriptor.statement
    )

  descriptor.name = descriptor.name.toLowerCase()
  descriptor.statement = method(declaration, 'execute')

  return func.define(descriptor)
}

/** @type {toa.node.define.operations.Test} */
export const test = (statement, name) => {
  const declaration = statement.type === 'ClassDeclaration'
  const known = names.includes(name)

  return declaration && known
}

/**
 * @param {Extract<toa.node.define.algorithms.Statement, { type: 'ClassDeclaration' }>} statement
 * @param {string} name
 * @returns {toa.node.define.algorithms.Method}
 */
const method = (statement, name) => {
  const methods = statement.body.body
  const method = methods.find(
    (method) => method.type === 'ClassMethod' && method.key.name === name
  )

  if (method === undefined) throw new Error(`Method '${name}' not found`)

  return method
}

const names = types.map((type) => capitalize(type))
