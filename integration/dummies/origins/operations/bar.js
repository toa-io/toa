'use strict'

async function transition (input, entity, context) {
  const options = {}

  if (input.retries !== undefined) {
    options.retry = { base: 0, retries: input.retries }
  }

  const response = await context.origins.local.path.to.something.get(undefined, options)
  const status = response.status

  const body = await response.json()

  return { output: { status, body } }
}

exports.transition = transition
