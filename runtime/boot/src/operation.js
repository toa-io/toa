'use strict'

const { Operation, State, entities } = require('@kookaburra/core')
const { Schema } = require('@kookaburra/schema')

const boot = require('./index')

const operation = (manifest, locator, declaration, storage, context) => {
  const { Bridge } = require(declaration.bridge)

  const bridge = new Bridge(declaration, context)
  const schema = new Schema(manifest.entity.schema)
  const entity = new entities.Factory(schema)
  const target = new State(storage, entity)
  const contract = boot.contract.reply(declaration.output, declaration.error)

  if (declaration.target in target) target.query = target[declaration.target]
  else throw new Error(`Unresolved target type '${declaration.target}'`)

  return new Operation(declaration, bridge, target, contract)
}

exports.operation = operation
