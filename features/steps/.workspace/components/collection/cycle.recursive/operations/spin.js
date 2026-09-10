export async function computation(input, context) {
  return context.remote.cycle.recursive.spin({ input })
}
