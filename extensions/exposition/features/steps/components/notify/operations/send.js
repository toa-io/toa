'use strict'

async function effect (input) {
  await new Promise((resolve) => setTimeout(resolve, 800))

  return null
}

exports.effect = effect
