'use strict'

function del (input, context) {
  return context.storages[input.storage].delete(input.path)
}

exports.effect = del
