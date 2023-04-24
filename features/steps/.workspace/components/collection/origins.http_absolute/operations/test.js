'use strict'

const url = 'http://localhost:8888/path/to/resource'

async function observation (input, none, context) {
  const response = await context.aspects.http(url)
  const output = await response.json()

  return { output }
}

exports.observation = observation
