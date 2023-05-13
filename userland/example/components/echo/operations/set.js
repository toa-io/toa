'use strict'

async function effect (input, context) {
  context.state.value = input
}

exports.effect = effect
