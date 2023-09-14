'use strict'

async function effect (input, context) {
  const one = context.local.plus({ input })
  const two = context.local.plus({ input })

  return await Promise.all([one, two])
}

exports.effect = effect
