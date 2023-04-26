'use strict'

async function computation (input, context) {
  return context.remote.calculations.sum({ input })
}

exports.computation = computation
