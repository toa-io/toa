'use strict'

async function fetch (input, context) {
  const storage = context.storages[input.storage]
  const entry = await storage.get(input.path)

  if (entry instanceof Error)
    return { entry }

  const stream = await storage.fetch(input.path)

  return { entry, stream }
}

exports.effect = fetch
