'use strict'

const { Transition, Observation, Assignment, State, Query, entities } = require('@toa.io/core')
const { Schema } = require('@toa.io/schema')

const boot = require('./index')

const operation = (manifest, endpoint, definition, context, storage, emission) => {
  const cascade = boot.cascade(manifest, endpoint, definition, context)
  const contract = boot.contract.reply(definition.output, definition.error)

  const schema = new Schema(manifest.entity.schema)
  const entity = new entities.Factory(schema)
  const subject = new State(storage, entity, emission, manifest.entity.initialized)
  const query = new Query(manifest.entity.schema.properties)

  subject.query = subject[definition.subject]

  const Type = TYPES[definition.type]

  return new Type(cascade, subject, contract, query, definition)
}

const TYPES = {
  transition: Transition,
  observation: Observation,
  assignment: Assignment
}

exports.operation = operation
