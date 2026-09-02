async function effect (input, context) {
  return await context.stash.incr(input)
}

export { effect }
