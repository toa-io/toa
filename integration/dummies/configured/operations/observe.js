'use strict'

async function observation (input, entity, context) {
  const output = {}

  output.foo = context.configuration.foo

  return { output }
}

exports.observation = observation
