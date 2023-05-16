'use strict'

async function computation (_, context) {
  const response = await context.http.dev.path.to.resource.get()
  const type = response.headers.get('content-type')

  if (type !== 'application/json') return { error: { code: 0, message: 'Unsupported media type ' + type } }

  const output = await response.json()

  return { output }
}

exports.computation = computation
