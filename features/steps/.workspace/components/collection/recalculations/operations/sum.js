async function computation (input, context) {
  return context.remote.calculations.sum({ input })
}

export { computation }
