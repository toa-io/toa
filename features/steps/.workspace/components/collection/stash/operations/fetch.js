'use strict'

async function computation (_, context) {
  return await context.stash.fetch('object')
}

exports.computation = computation
