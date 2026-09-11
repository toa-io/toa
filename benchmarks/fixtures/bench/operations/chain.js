export async function computation(input, context) {
  return await context.remote.default.peer.answer({ input: { n: 1 } })
}
