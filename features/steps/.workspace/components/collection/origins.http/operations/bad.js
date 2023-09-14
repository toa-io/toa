'use strict'

async function computation (input, context) {
  const response = await context.http.bad.path.get()

  return await response.json()
}

exports.computation = computation
