async function computation (input, context) {
  return context.remote.math.calculations.sum({ input })
}

export { computation }
