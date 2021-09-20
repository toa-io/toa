'use strict'

const { Operation, State, entities } = require('@kookaburra/core')
const { Schema } = require('@kookaburra/schema')

const boot = require('./index')

const operation = (manifest, locator, declaration, storage, path) => {
  const cascade = boot.cascade(manifest, declaration, path)
  const contract = boot.contract.reply(declaration.output, declaration.error)

  const schema = new Schema(manifest.entity.schema)
  const entity = new entities.Factory(schema)
  const target = new State(storage, entity)

  if (declaration.target in target) target.query = target[declaration.target]
  else throw new Error(`Unresolved target type '${declaration.target}'`)

  return new Operation(declaration, cascade, target, contract)
}

exports.operation = operation
