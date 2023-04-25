'use strict'

async function computation (input, context) {
  const response = await context.http.bad.path.get()
  const output = await response.json()

  return { output }
}

exports.computation = computation
