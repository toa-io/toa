// noinspection JSUnresolvedVariable

'use strict'

async function transition (input, object, context) {
  if (input.text === 'throw exception') throw new Error('User space exception')

  const { free, ...message } = input

  Object.assign(object, message)

  if (free !== true) {
    const price = context.configuration.price
    const request = { input: price, query: { id: input.sender } }
    const reply = await context.remote.credits.balance.debit(request)

    if (reply.error !== undefined) return { error: reply.error }
  }

  return { output: { id: object.id } }
}

exports.transition = transition
