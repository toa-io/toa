'use strict'

async function observation (input, object, context) {
  return context.configuration.foo
}

exports.observation = observation
