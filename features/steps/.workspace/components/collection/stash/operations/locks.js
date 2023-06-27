'use strict'

async function effect (input, context) {
  const one = context.local.plus({ input })
  const two = context.local.plus({ input })
  const three = context.local.plus({ input })

  const replies = await Promise.all([one, two, three])

  const result = replies.map((reply) => reply.output)

  console.log(result)

  return result
}

exports.effect = effect
