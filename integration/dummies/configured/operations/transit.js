'use strict'

async function transition (input, object, context) {
  const output = {}

  output.foo = context.aspects.configuration(['foo'])

  return output
}

exports.transition = transition
