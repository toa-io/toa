export async function computation(input, context) {
  // one object, three calls — as `identity.credentials.list` does
  const request = { input: { a: 1, b: 2 } }

  return Promise.all([
    context.remote.math.calculations.sum(request),
    context.remote.math.calculations.sum(request),
    context.remote.math.calculations.sum(request)
  ])
}
