'use strict'

const { Operation, State, entities } = require('@kookaburra/core')
const { Schema } = require('@kookaburra/schema')

const boot = require('./index')

const operation = (manifest, endpoint, definition, context, storage, emission) => {
  const cascade = boot.cascade(manifest, endpoint, definition, context)
  const contract = boot.contract.reply(definition.output, definition.error)

  const schema = new Schema(manifest.entity.schema)
  const entity = new entities.Factory(schema)
  const target = new State(storage, entity, emission)

  if (target[definition.target] !== undefined) target.query = target[definition.target]
  else throw new Error(`Unresolved target type '${definition.target}'`)

  return new Operation(definition.type, cascade, target, contract)
}

exports.operation = operation
