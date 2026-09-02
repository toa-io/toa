async function computation (input, context) {
  return context.remote.probe.target.compute({ input })
}

export { computation }
