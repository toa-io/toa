'use strict'

async function transfer (source, entry, context) {
  const reply = await context.local.nullify({ query: { id: source } })

  entry.balance += reply.output

  return { output: entry.balance }
}

exports.transition = transfer
