async function effect (input, context) {
  await context.stash.del(input)
}

export { effect }
