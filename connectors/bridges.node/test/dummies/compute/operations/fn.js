'use strict'

async function computation (input, object, context) {
  return { output: { input, state: object, context: context !== undefined } }
}

exports.computation = computation
