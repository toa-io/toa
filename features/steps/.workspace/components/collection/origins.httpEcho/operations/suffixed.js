'use strict'

async function computation (input, context) {
  const response = await context.http.suffixed.path.get()
  const output = await response.json()

  return { output }
}

exports.computation = computation
