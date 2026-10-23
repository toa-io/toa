export async function effect(input, context) {
  await context.chronicles.send('searched', { query: input.query })

  return { query: input.query }
}
