export async function transition(input, entry, context) {
  await context.remote.mongo.once.transit({
    input: { foo: input.foo },
    query: { id: input.target }
  })

  entry.foo = input.foo

  return entry
}
