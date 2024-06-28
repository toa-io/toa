'use strict'

async function computation (_, context) {
  const output = {}

  output.foo = context.configuration.foo
  output.bar = context.configuration.bar
  output.baz = context.configuration.baz
  output.qux = context.configuration.qux

  return output
}

exports.computation = computation
