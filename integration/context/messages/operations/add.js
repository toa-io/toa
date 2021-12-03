'use strict'

async function transition (input, entity, context) {
  if (input.text === 'throw exception') throw new Error('User space exception')

  const { free, ...message } = input

  Object.assign(entity, message)

  if (free !== true) {
    const reply = await context.remote.credits.balance.debit({ input: 1, query: { id: input.sender } })

    if (reply.error !== undefined) return { error: reply.error }
  }

  return { output: { id: entity.id } }
}

exports.transition = transition
