export async function effect(input, context) {
  const numbers = await context.remote.streams.numbers.generate({ input: { limit: 3 } })

  for await (const _ of numbers);

  await context.remote.continued.tally.bump({ query: { id: input.b }, input: {} })
}
