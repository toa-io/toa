'use strict'

async function effect (input, context) {
  return context.configuration.foo
}

exports.effect = effect
