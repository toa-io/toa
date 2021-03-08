'use strict'

const { entities, schemas, State } = require('@kookaburra/runtime')

const entity = (entity, storage) => {
  if (entity === undefined) { return (algorithm) => ({ algorithm }) }

  const validator = new schemas.Validator()

  validator.add(entity.schema)

  const schema = new schemas.Schema(entity.schema.$id, validator)
  const instance = new entities.Factory(schema)

  const operations = (algorithm) => {
    const target = new State(storage, instance)

    target.query = target[algorithm.target]

    if (!target.query) { throw new Error(`Unresolved target type '${algorithm.target}'`) }

    return { algorithm, target }
  }

  return operations
}

exports.entity = entity
