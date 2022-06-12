'use strict'

async function transition (input, entity, context) {
  const response = await context.origins.local.path.to.something.get()
  const status = response.status

  return { output: { status } }
}

exports.transition = transition
