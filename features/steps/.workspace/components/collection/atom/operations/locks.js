'use strict'

async function effect (input, context) {
  // a key of its own each run, so the counter behind it starts from nothing
  const key = `plusing:${Date.now()}`

  const one = context.local.plus({ input: { ...input, key } })
  const two = context.local.plus({ input: { ...input, key } })

  return await Promise.all([one, two])
}

exports.effect = effect
