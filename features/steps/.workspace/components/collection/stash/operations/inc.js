'use strict'

async function effect (input, context) {
  const output = await context.stash.incr(input)

  return { output }
}

exports.effect = effect
