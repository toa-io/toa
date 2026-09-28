export async function computation(input, context) {
  if (input.depth === 0) return 0

  const below = await context.remote.cycle.recursive.descend({ input: { depth: input.depth - 1 } })

  return below + 1
}
