'use strict'

async function transfer (source, object, context) {
  const balance = await context.local.nullify({ query: { id: source } })

  object.balance += balance

  return object.balance
}

exports.transition = transfer
