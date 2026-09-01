'use strict'

/** what the lock is proved on: read, yield, write. Unheld, both calls read the same value. */
const counters = {}

async function effect (input, context) {
  return await context.atom.lock(input.key, async () => {
    const value = counters[input.key] ?? 0

    await new Promise((resolve) => setTimeout(resolve, input.delay))

    counters[input.key] = value + 1

    return counters[input.key]
  })
}

exports.effect = effect
