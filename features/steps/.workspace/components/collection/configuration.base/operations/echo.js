'use strict'

async function computation (input, context) {
  const output = {}

  output.foo = context.configuration.foo

  if (context.configuration.bar?.baz) {
    output.baz = context.configuration.bar.baz
  }

  return output
}

exports.computation = computation
