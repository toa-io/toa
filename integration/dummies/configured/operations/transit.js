'use strict'

async function transition (input, object, context) {
  const output = {}

  output.foo = context.annexes.configuration(['foo'])

  return { output }
}

exports.transition = transition
