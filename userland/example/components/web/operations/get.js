'use strict'

async function computation (_, context) {
  const response = await context.fetch('http://api.example.com/path/to/resource')
  const type = response.headers.get('content-type')

  if (type !== 'application/json')
    return ERR_UNSUPPORTED_MEDIA_TYPE

  return await response.json()
}

const ERR_UNSUPPORTED_MEDIA_TYPE = new Error('UNSUPPORTED_MEDIA_TYPE')

exports.computation = computation
