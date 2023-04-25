'use strict'

async function observation (input, object, context) {
  const foo = context.configuration.foo

  return { output: foo }
}

exports.observation = observation
