async function head (input, context) {
  return await context.storages[input.storage].head(input.path)
}

export { head as computation }
