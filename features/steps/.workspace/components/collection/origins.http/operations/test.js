'use strict'

async function computation (_, context) {
  const response = await context.http.echo.path.get()
  const output = await response.json()

  return { output }
}

exports.computation = computation
