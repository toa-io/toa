'use strict'

async function transition (input, entry) {
  Object.assign(entry, input)

  return { id: entry.id }
}

module.exports = transition
