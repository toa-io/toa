'use strict'

/** @type {toa.node.define.operations.Define} */
const define = (statement, name) => {
  if (!test(statement, name)) return null

  const match = name.match(pattern)

  /** @type {toa.node.define.operations.Definition} */
  const definition = {}

  definition.type = /** @type {typeof toa.norm.component.Operation.subject} */ match[2].toLowerCase()
  definition.subject = /** @type {typeof toa.norm.component.Operation.type} */ match[1].toLowerCase()

  return definition
}

/** @type {toa.node.define.operations.Test} */
const test = (statement, name) => {
  const declaration = statement.type === 'ClassDeclaration'
  const match = name.match(pattern) !== null

  return declaration && match
}

const pattern = new RegExp('^(Objects?|Changeset)(Transition|Observation|Assignment)Factory$')

exports.define = define
exports.test = test
