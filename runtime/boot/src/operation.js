'use strict'

const { Observation, Transition, State, Query, entities } = require('@kookaburra/core')
const { Schema } = require('@kookaburra/schema')

const boot = require('./index')

const operation = (manifest, endpoint, definition, context, storage, emission) => {
  const cascade = boot.cascade(manifest, endpoint, definition, context)
  const contract = boot.contract.reply(definition.output, definition.error)

  const schema = new Schema(manifest.entity.schema)
  const entity = new entities.Factory(schema)
  const subject = new State(storage, entity, emission, manifest.entity.initialized)
  const query = new Query(manifest.entity.schema.properties)

  if (subject[definition.subject] !== undefined) subject.query = subject[definition.subject]
  else throw new Error(`Unresolved subject type '${definition.subject}'`)

  if (TYPES[definition.type] === undefined) throw new Error(`Unresolved operation type '${definition.type}'`)

  const Type = TYPES[definition.type]

  return new Type(cascade, subject, contract, query)
}

const TYPES = {
  transition: Transition,
  observation: Observation
}

exports.operation = operation
