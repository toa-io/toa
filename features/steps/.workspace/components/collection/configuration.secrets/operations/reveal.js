async function computation (input, context) {
  return context.configuration.b.unwrap()
}

export { computation }
