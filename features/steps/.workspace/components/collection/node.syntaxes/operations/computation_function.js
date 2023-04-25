'use strict'

async function computation (input, context) {
  return context.configuration.foo
}

exports.computation = computation
