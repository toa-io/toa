'use strict'

async function computation (input, context) {
  const output = {}

  output.foo = context.configuration.foo
  output.bar = context.configuration.bar

  if (context.configuration.num !== undefined)
    output.num = context.configuration.num

  return output
}

exports.computation = computation
