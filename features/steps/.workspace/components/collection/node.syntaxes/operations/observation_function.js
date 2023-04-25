'use strict'

async function observation (input, object, context) {
  const foo = context.configuration.foo

  return { foo }
}

exports.observation = observation
