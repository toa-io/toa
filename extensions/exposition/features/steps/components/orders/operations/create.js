'use strict'

async function transition (input, object, context) {
  const price = await context.remote.default.pricing.quote({ input: { volume: input.volume } })

  return Object.assign(object, { ...input, price })
}

exports.transition = transition
