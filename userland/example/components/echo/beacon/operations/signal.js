'use strict'

async function computation (input, context) {
  return context.configuration.signal
}

exports.computation = computation
