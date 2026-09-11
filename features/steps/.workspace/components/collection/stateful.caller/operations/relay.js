// an addressed call made from a component, as a component makes one
export async function computation(input, context) {
  const request = { input: input.input ?? null, instance: input.instance }
  const options = input.timeout === undefined ? undefined : { timeout: input.timeout }

  return await context.remote.stateful.counter[input.endpoint](request, options)
}
