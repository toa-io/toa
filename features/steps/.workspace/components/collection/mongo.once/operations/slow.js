export async function transition(input, entry) {
  await new Promise((resolve) => setTimeout(resolve, 300))

  entry.foo = input.foo

  return entry
}
