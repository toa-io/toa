'use strict'

const { entities, schemas, state: { Object, Collection } } = require('@kookaburra/runtime')

const entity = (entity, storage) => {
  if (entity === undefined) { return (algorithm) => ({ algorithm }) }

  const validator = new schemas.Validator()

  validator.add(entity.schema)

  const schema = new schemas.Schema(entity.schema.$id, validator)
  const instance = new entities.Factory(schema)

  const operations = (algorithm) => {
    const Target = TARGETS[algorithm.target]

    if (!Target) { throw new Error(`Unresolved target type '${algorithm.target}'`) }

    const target = new Target(storage, instance)

    return { algorithm, target }
  }

  return operations
}

const TARGETS = {
  object: Object,
  collection: Collection
}

exports.entity = entity
