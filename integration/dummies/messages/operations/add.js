'use strict'

async function transition (input, entry, context) {
  entry.sender = input.sender
  entry.text = input.text
  entry.timestamp = input.timestamp

  if (input.text === 'throw exception') throw new Error('User space exception')

  if (input.free !== true) {
    const reply = await context.remotes[0].invoke('deduce', { input: 1, query: { id: input.sender } })

    if (reply.error !== undefined) return { error: reply.error }
  }

  return { output: { id: entry.id } }
}

exports.transition = transition
