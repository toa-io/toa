'use strict'

const { Transition, Observation, Assignment, Operation, Query, Effect } = require('@toa.io/core')

const boot = require('./index')

async function operation (manifest, endpoint, definition, context, scope) {
  const cascade = await boot.cascade(manifest, endpoint, definition, context)
  const reply = boot.contract.reply(definition.output, definition.error)
  const input = definition.input
  const request = boot.contract.request({ input }, manifest.entity)
  const contracts = { reply, request }
  const query = manifest.entity === undefined
    ? undefined
    : new Query(manifest.entity.schema.properties)

  const Type = TYPES[definition.type]

  return new Type(cascade, scope, contracts, query, definition)
}

const TYPES = {
  transition: Transition,
  observation: Observation,
  assignment: Assignment,
  computation: Operation,
  effect: Effect
}

exports.operation = operation
