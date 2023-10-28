'use strict'

function computation (input, context) {
  return context.storages[input.storage].get(input.path)
}

exports.computation = computation
