'use strict'

async function observation (input, none, context) {
  const response = await context.origins.echo.path.get()
  const output = await response.json()

  return { output }
}

exports.observation = observation
