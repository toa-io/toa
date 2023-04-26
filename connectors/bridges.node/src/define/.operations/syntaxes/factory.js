// noinspection JSValidateTypes

'use strict'

/** @type {toa.node.define.operations.Define} */
const define = (descriptor) => {
  const match = descriptor.name.match(pattern)

  /** @type {toa.node.define.operations.Definition} */
  const definition = {}

  definition.type = match.groups.type.toLowerCase()
  definition.scope = match.groups.scope?.toLowerCase()

  return definition
}

/** @type {toa.node.define.operations.Test} */
const test = (statement, name) => {
  const declaration = statement.type === 'ClassDeclaration'
  const match = name.match(pattern) !== null

  return declaration && match
}

const pattern = new RegExp('^(?<scope>Objects?|Changeset)?(?<type>Transition|Observation|Assignment|Computation|Effect)Factory$')

exports.define = define
exports.test = test
