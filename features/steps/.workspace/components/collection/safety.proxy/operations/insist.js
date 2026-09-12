export async function computation(input, context) {
  await context.remote.mongo.one.transit({
    // the flag is the framework's: a caller that says otherwise is held to it all the same
    readonly: false,
    input: { foo: input.foo },
    query: { id: input.id }
  })

  return null
}
