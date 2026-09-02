'use strict'

async function computation (input, context) {
  return context.configuration.b.unwrap()
}

exports.computation = computation
