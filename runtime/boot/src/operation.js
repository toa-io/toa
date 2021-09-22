'use strict'

const { Operation, State, entities } = require('@kookaburra/core')
const { Schema } = require('@kookaburra/schema')

const boot = require('./index')

const operation = (manifest, declaration, context, storage, emission) => {
  const cascade = boot.cascade(manifest, declaration, context)
  const contract = boot.contract.reply(declaration.output, declaration.error)

  const schema = new Schema(manifest.entity.schema)
  const entity = new entities.Factory(schema)
  const target = new State(storage, entity, emission)

  if (target[declaration.target] !== undefined) target.query = target[declaration.target]
  else throw new Error(`Unresolved target type '${declaration.target}'`)

  return new Operation(declaration.type, cascade, target, contract)
}

exports.operation = operation
