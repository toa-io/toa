'use strict'

async function computation (_, context) {
  return await context.stash.get('key')
}

exports.computation = computation
