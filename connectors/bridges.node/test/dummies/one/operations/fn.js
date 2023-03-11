'use strict'

async function transition (input, object, context) {
  return { output: { input, state: object, context: context !== undefined } }
}

exports.transition = transition
