'use strict'

async function transfer (source, entity, context) {
  const reply = await context.local.nullify({ query: { id: source } })

  entity.balance += reply.output

  return { output: entity.balance }
}

exports.transition = transfer
