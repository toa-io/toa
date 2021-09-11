'use strict'

async function transition (input, entry, context) {
  Object.assign(entry, input)

  if (input.text === 'throw exception') throw new Error('exception')

  const response = await context.remotes[0].invoke('deduce')

  console.log(response)

  return { id: entry.id }
}

module.exports = transition
