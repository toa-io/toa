async function meter (input, context) {
  return context.atom.meter(input.keys, input.deltas)
}

export { meter as computation }
