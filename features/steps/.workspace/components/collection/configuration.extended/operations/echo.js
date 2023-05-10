'use strict'

async function computation (input, context) {
  const output = {}

  output.bar = context.configuration.bar

  return { output }
}

exports.computation = computation
