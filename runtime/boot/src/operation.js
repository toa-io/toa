'use strict'

const { Transition, Observation, Assignment, Query } = require('@toa.io/core')

const boot = require('./index')

const operation = (manifest, endpoint, definition, context, scope) => {
  const cascade = boot.cascade(manifest, endpoint, definition, context)
  const contract = boot.contract.reply(definition.output, definition.error)
  const query = new Query(manifest.entity.schema.properties)
  const Type = TYPES[definition.type]

  return new Type(cascade, scope, contract, query, definition)
}

const TYPES = {
  transition: Transition,
  observation: Observation,
  assignment: Assignment
}

exports.operation = operation
