'use strict'

async function computation (input, context) {
  const response = await context.http.port.path.get()
  const output = await response.json()

  return { output }
}

exports.computation = computation
