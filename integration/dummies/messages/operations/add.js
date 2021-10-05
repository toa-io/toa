'use strict'

async function transition (input, entry, context) {
  Object.assign(entry, input)

  if (input.text === 'throw exception') throw new Error('User space exception')

  const reply = await context.remotes[0].invoke('deduce', { input: 1, query: { id: input.sender } })

  if (reply.error !== undefined) return [null, reply.error]

  return { id: entry.id }
}

module.exports = transition
