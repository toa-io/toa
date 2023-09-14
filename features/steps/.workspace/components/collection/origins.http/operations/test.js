'use strict'

async function computation (_, context) {
  const response = await context.http.echo.path.get()

  return await response.json()
}

exports.computation = computation
