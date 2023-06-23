'use strict'

async function computation (object, context) {
  await context.stash.store('object', object)
}

exports.computation = computation
