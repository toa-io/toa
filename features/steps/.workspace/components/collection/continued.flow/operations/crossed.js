import { setTimeout } from 'node:timers/promises'
import { attempt } from '../attempts.js'

/**
 * Each branch checks that the answer it is given is the one to what it asked, so an answer handed
 * to the other branch fails the run rather than passing unnoticed.
 */
export async function effect(input, context) {
  const n = attempt('crossed', input)

  // the first branch to ask on one attempt is the last on the next
  const [early, late] = n % 2 === 1 ? [0, 100] : [100, 0]

  await Promise.all([
    branch(context, input.a, early),
    branch(context, input.b, late)
  ])

  if (n <= input.fail) throw new Error('Failing on purpose')

  await context.remote.continued.tally.bump({ query: { id: input.c } })
}

async function branch(context, id, delay) {
  await setTimeout(delay)

  const reply = await context.remote.continued.tally.bump({ query: { id } })

  if (reply.id !== id) throw new Error(`Asked about ${id}, answered about ${reply.id}`)
}
