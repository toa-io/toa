'use strict'

function permute (input, context) {
  return context.storages[input.storage].permute(input.path, input.list)
}

exports.effect = permute
