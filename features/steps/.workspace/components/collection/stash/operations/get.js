'use strict'

async function computation (_, context) {
  const output = await context.stash.get('key')

  return { output }
}

exports.computation = computation
