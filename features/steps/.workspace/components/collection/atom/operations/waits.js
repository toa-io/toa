/** a lock of `key`, which another replica may hold */
export async function effect(input, context) {
  return await context.atom.lock(input.key, async () => 'held')
}
