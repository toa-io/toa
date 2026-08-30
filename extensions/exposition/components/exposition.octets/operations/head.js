'use strict'

async function head (input, context) {
  return await context.storages[input.storage].head(input.path)
}

exports.computation = head
