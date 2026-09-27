export async function transition(input, entry, context) {
  const price = await context.remote.default.pricing.quote({
    input: { volume: input.volume }
  })

  return Object.assign(entry, { ...input, price })
}
