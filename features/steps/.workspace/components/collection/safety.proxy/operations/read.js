export async function computation(input, context) {
  const entity = await context.remote.mongo.one.observe({ query: { id: input.id } })

  return entity.foo
}
