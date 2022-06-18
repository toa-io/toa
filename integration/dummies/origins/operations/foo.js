'use strict'

async function transition (input, entity, context) {
  const response = await context.extensions.origins('local')
  const status = response.status

  return { output: { status } }
}

exports.transition = transition
