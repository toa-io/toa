'use strict'

const { posix } = require('node:path')
const { Err } = require('error-value')

async function fetch (input, context) {
  const storage = context.storages[input.storage]
  const basename = posix.basename(input.path)
  const path = posix.dirname(input.path)
  const [id, suffix] = split(basename)
  const entry = await storage.get(posix.join(path, id))

  if (entry instanceof Error)
    return entry

  let variant

  if (suffix !== undefined) {
    variant = entry.variants.find((variant) => variant.name === suffix)

    if (variant === undefined)
      return NOT_FOUND
  }

  const stream = await storage.fetch(input.path)

  if (stream instanceof Error)
    return stream

  const { type, size } = variant ?? entry

  return { stream, checksum: entry.id, type, size }
}

function split (basename) {
  const dot = basename.indexOf('.')

  if (dot === -1)
    return [basename, undefined]
  else
    return [basename.slice(0, dot), basename.slice(dot + 1)]
}

const NOT_FOUND = Err('NOT_FOUND')

exports.effect = fetch
