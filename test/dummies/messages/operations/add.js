'use strict'

async function transition (input, entry) {
  Object.assign(entry, input)

  if (input.text === 'throw exception') throw new Error('exception')

  return { id: entry.id }
}

module.exports = transition
