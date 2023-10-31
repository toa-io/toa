'use strict'

async function permute (input, context) {
  const storage = context.storages[input.storage]

  console.log('permute', input.list)

  return await storage.permute(input.path, input.list)
}

exports.effect = permute
