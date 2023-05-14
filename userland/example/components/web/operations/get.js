'use strict'

async function computation (_, context) {
  const response = await context.http.dev.path.to.resource.get()
  const output = await response.json()

  return { output }
}

exports.computation = computation
