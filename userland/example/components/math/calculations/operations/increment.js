'use strict'

async function observation (input, none, context) {
  let value = input.value

  for (let i = 0; i < input.times; i++) {
    const reply = await context.local.add({ input: { a: value, b: 1 } })

    value = reply.output
  }

  return value
}

exports.observation = observation
