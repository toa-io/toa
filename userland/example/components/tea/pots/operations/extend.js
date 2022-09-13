'use strict'

async function transition (_, object, context) {
  const volume = object.volume + context.configuration.step
  const input = { volume }
  const query = { id: object.id }
  const request = { input, query }

  await context.local.transit(request)
}

exports.transition = transition
