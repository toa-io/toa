export async function effect(input, context) {
  await context.chronicles.send('whispered', { query: input.query })

  return { query: input.query }
}
