'use strict'

/** @type {toa.node.define.operations.Define} */
const define = (descriptor) => {
  const match = descriptor.name.match(pattern)

  /** @type {toa.node.define.operations.Definition} */
  const definition = {}

  definition.type = /** @type {typeof toa.norm.component.Operation.scope} */ match[2].toLowerCase()
  definition.scope = /** @type {typeof toa.norm.component.Operation.type} */ match[1].toLowerCase()

  return definition
}

/** @type {toa.node.define.operations.Test} */
const test = (statement, name) => {
  const declaration = statement.type === 'ClassDeclaration'
  const match = name.match(pattern) !== null

  return declaration && match
}

const pattern = new RegExp('^(Objects?|Changeset|None)(Transition|Observation|Assignment)Factory$')

exports.define = define
exports.test = test
