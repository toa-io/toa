'use strict'

const { entities, State } = require('@kookaburra/runtime')

const entity = (entity, storage, schemas) => {
  if (entity === undefined) { return (algorithm) => ({ algorithm }) }

  const schema = schemas.add(entity.schema)
  const instance = new entities.Factory(schema, storage.constructor)

  return (algorithm) => {
    const target = new State(storage, instance)

    target.query = target[algorithm.target]

    if (!target.query) { throw new Error(`Unresolved target type '${algorithm.target}'`) }

    return { algorithm, target, schemas }
  }
}

exports.entity = entity
