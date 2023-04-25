'use strict'

const url = 'http://localhost:8888/path/to/resource'

async function computation (input, context) {
  const response = await context.aspects.http(url)
  const output = await response.json()

  return { output }
}

exports.computation = computation
