'use strict'

async function meter (input, context) {
  // a key of its own each run, so what the debt starts from is known
  const key = `${input.name}:${Date.now()}`

  const [first] = await context.stash.meter([key], [input.delta])
  const [second] = await context.stash.meter([key], [input.delta])

  return { debt: first, adds: second > first }
}

exports.computation = meter
