'use strict'

const { Nope } = require('nopeable')

async function computation (_, context) {
  const response = await context.http.dev.path.to.resource.get()
  const type = response.headers.get('content-type')

  if (type !== 'application/json') return new Nope(0, 'Unsupported media type ' + type)

  return await response.json()
}

exports.computation = computation
