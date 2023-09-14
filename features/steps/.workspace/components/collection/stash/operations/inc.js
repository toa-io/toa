'use strict'

async function effect (input, context) {
  return await context.stash.incr(input)
}

exports.effect = effect
