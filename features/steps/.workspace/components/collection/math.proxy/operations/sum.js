'use strict'

async function computation (input, context) {
  return context.remote.math.calculations.sum({ input })
}

exports.computation = computation
