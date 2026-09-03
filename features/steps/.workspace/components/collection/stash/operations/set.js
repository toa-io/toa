export async function effect (input, context) {
  await context.stash.set('key', input)
}
