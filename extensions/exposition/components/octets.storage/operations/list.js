'use strict'

function list (input, context) {
  return context.storages[input.storage].list(input.path)
}

exports.effect = list
