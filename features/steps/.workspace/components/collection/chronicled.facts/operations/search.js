export async function effect(input, context) {
  await context.chronicles.send(
    'searched',
    { query: input.query },
    { identity: input.identity }
  )

  return { query: input.query }
}
