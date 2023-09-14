'use strict'

async function computation (_, context) {
  const response = await context.http.suffixed.path.get()

  return await response.json()
}

exports.computation = computation
