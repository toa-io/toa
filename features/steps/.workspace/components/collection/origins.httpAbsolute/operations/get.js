'use strict'

async function computation (input, context) {
  const response = await context.aspects.http(input.url)

  return await response.json()
}

exports.computation = computation
