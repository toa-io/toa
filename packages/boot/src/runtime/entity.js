'use strict'

const { entities, State } = require('@kookaburra/runtime')

const entity = (entity, storage, schemas) => {
  if (entity === undefined) { return (algorithm) => ({ algorithm }) }

  const schema = schemas.add(entity.schema)

  // noinspection JSUnresolvedFunction
  const instance = new entities.Factory(schema, () => storage.constructor.id())

  return (manifest) => {
    const target = new State(storage, instance)

    target.query = target[manifest.target]

    if (!target.query) { throw new Error(`Unresolved target type '${manifest.target}'`) }

    return { manifest, target, schemas, entity }
  }
}

exports.entity = entity
