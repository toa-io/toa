'use strict'

const { Operation, State, entities } = require('@kookaburra/core')
const { Schema } = require('@kookaburra/schema')

const operation = (manifest, locator, descriptor, storage, context) => {
  const { Bridge } = require(descriptor.bridge)

  const bridge = new Bridge(descriptor, context)
  const schema = new Schema(manifest.entity.schema)
  const entity = new entities.Factory(schema)
  const target = new State(storage, entity)

  if (descriptor.target in target) target.query = target[descriptor.target]
  else throw new Error(`Unresolved target type '${descriptor.target}'`)

  return new Operation(bridge, target)
}

exports.operation = operation
