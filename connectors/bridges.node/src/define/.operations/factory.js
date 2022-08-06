'use strict'

/** @type {toa.node.define.operations.Define} */
const define = (statement, name) => {
  if (statement.type !== 'ClassDeclaration') return null

  const match = name.match(pattern)

  if (match === null) return null

  /** @type {toa.node.define.operations.Definition} */
  const definition = {}

  definition.type = /** @type {typeof toa.norm.component.Operation.subject} */ match[2].toLowerCase()
  definition.subject = /** @type {typeof toa.norm.component.Operation.type} */ match[1].toLowerCase()

  return definition
}

const pattern = new RegExp('^(Objects?|Changeset)(Transition|Observation|Assignment)Factory$')

exports.define = define
