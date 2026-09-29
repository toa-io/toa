import { attempt } from '../attempts.js'

export async function effect(input, context) {
  const response = await context.fetch(process.env.FEATURES_FETCH_URL, { method: 'POST' })
  const body = await response.json()

  if (response.status !== 200 || body.attempt !== 1)
    throw new Error(`Answered ${response.status} on the endpoint's attempt ${body.attempt}`)

  if (attempt('fetched', input) <= input.fail) throw new Error('Failing on purpose')

  await context.remote.continued.tally.bump({ query: { id: input.b }, input: {} })
}
