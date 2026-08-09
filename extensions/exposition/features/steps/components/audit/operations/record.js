'use strict'

async function effect (input) {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return null
}

exports.effect = effect
