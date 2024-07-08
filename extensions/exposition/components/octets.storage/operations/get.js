'use strict'

async function get (input, context) {
  return await context.storages[input.storage].get(input.path)
}

exports.computation = get
