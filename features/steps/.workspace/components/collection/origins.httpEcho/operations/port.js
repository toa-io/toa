'use strict'

async function computation (input, context) {
  const response = await context.http.port.path.get()

  return await response.json()
}

exports.computation = computation
