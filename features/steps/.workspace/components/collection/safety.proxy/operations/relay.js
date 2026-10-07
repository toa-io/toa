export async function effect(input, context) {
  await context.remote.mongo.one.transit({
    input: { foo: input.foo },
    query: { id: input.id }
  })

  return null
}
