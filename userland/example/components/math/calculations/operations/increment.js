'use strict'

async function transition (input, _, context) {
  return await context.local.add({ input: { a: input, b: 1 } })
}

exports.transition = transition
