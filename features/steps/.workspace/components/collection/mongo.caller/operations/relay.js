export async function transition(input, object, context) {
  await context.remote.mongo.once.transit({
    input: { foo: input.foo },
    query: { id: input.target }
  })

  object.foo = input.foo

  return object
}
