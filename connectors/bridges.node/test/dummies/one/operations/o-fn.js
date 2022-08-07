'use strict'

async function transition (input, object, context) {
  return { input, state: object, context: context !== undefined }
}

exports.transition = transition
