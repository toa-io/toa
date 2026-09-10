export async function transition(input, object) {
  await new Promise((resolve) => setTimeout(resolve, 300))

  object.foo = input.foo

  return object
}
