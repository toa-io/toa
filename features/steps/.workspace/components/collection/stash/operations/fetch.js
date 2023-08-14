'use strict'

async function computation (_, context) {
  const output = await context.stash.fetch('object')

  return { output }
}

exports.computation = computation
