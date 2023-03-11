'use strict'

async function transfer (source, object, context) {
  const reply = await context.local.nullify({ query: { id: source } })

  object.balance += reply.output

  return { output: object.balance }
}

exports.transition = transfer
