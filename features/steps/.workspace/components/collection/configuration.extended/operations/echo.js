'use strict'

async function computation (_, context) {
  const output = {}

  output.foo = context.configuration.foo
  output.bar = context.configuration.bar

  return output
}

exports.computation = computation
