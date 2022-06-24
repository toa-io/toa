'use strict'

async function transition (input, entity, context) {
  const output = {}
  const { a, b } = context.configuration.bar

  output.sum = a + b
  output.foo = context.configuration.foo

  return { output }
}

exports.transition = transition
