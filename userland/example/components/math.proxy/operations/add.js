async function computation (input, context) {
  const request = { input }

  // noinspection JSUnresolvedVariable
  return context.remote.math.calculations.add(request)
}

export { computation }
