// noinspection JSValidateTypes

/** @type {toa.node.define.operations.Define} */
export const define = (descriptor) => {
  const match = descriptor.name.match(pattern)

  /** @type {toa.node.define.operations.Definition} */
  const definition = {}

  definition.type = match.groups.type.toLowerCase()
  definition.scope = match.groups.scope?.toLowerCase()

  return definition
}

/** @type {toa.node.define.operations.Test} */
export const test = (statement, name) => {
  const declaration = statement.type === 'ClassDeclaration'
  const match = name.match(pattern) !== null

  return declaration && match
}

const pattern = new RegExp('^(?<scope>Objects?|Changeset)?(?<type>Transition|Observation|Assignment|Computation|Effect)Factory$')
