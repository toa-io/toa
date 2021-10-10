'use strict'

async function transit (input, entry) {
  Object.assign(entry, input)

  return { id: entry.id }
}

exports.transition = transit
