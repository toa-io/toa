'use strict'

async function effect (input, context) {
  await context.stash.del(input)
}

exports.effect = effect
