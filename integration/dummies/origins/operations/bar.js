'use strict'

async function transition (input, object, context) {
  const options = {}

  if (input.retries !== undefined) {
    options.retry = { base: 0, retries: input.retries }
  }

  const response = await context.http.local.path.to.something.get(undefined, options)
  const status = response.status

  const body = await response.json()

  return { status, body }
}

exports.transition = transition
