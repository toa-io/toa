'use strict'

async function effect (input, context) {
  const one = context.local.plus({ input })
  const two = context.local.plus({ input })
  const replies = await Promise.all([one, two])

  return replies.map((reply) => reply.output)
}

exports.effect = effect
