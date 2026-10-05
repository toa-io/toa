import { attempt } from '../attempts.js'

export async function effect(input, context) {
  const reply = await context.remote.continued.tally.refuse({})

  if (attempt('refused', input) <= input.fail) throw new Error('Failing on purpose')

  const kept =
    reply instanceof Error &&
    reply.code === 'REFUSED' &&
    reply.message === 'REFUSED' &&
    reply.cause?.made === input.made

  await context.remote.continued.tally.bump({
    query: { id: kept ? input.a : input.b },
    input: {}
  })
}
