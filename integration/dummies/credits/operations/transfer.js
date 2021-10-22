'use strict'

// .transfer({ input: source, query: { id: target } })

async function transfer (source, entry, context) {
  const balance = await context.local.nullify({ query: { id: source } })

  entry.balance += balance
}

exports.transition = transfer
