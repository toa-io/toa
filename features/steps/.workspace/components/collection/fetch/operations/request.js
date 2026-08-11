'use strict'

exports.computation = async (input, context) => {
  const response = await context.fetch(process.env.TOA_FEATURES_FETCH_URL, {
    method: input.method,
    retry: input.retry
  })
  const body = await response.json()

  return {
    status: response.status,
    attempt: body.attempt
  }
}
