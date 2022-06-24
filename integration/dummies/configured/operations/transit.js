'use strict'

async function transition (input, entity, context) {
  const output = {}

  output.foo = context.extensions.configuration(['foo'])

  return { output }
}

exports.transition = transition
