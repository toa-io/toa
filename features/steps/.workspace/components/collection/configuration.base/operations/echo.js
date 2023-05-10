'use strict'

async function computation (input, context) {
  const output = {}

  output.foo = context.configuration.foo

  return { output }
}

exports.computation = computation
