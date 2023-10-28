'use strict'

async function effect (input, context) {
  await context.stash.set('key', input)
}

exports.effect = effect
