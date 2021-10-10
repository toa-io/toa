'use strict'

// .transfer({ input: source, query: { id: target } })

async function transition (source, entry, context) {
  const balance = await context.local.nullify({ query: { id: source } })

  entry.balance += balance
}

exports.transition = transition
