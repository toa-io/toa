async function effect (input, context) {
  await context.stash.set('key', input)
}

export { effect }
