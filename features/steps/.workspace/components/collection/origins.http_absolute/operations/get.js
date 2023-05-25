'use strict'

async function computation (input, context) {
  const response = await context.aspects.http(input.url)
  const output = await response.json()

  return { output }
}

exports.computation = computation
