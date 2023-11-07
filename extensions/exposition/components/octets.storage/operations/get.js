'use strict'

function get (input, context) {
  return context.storages[input.storage].get(input.path)
}

exports.computation = get
