'use strict'

async function computation (input, context) {
  let value = input.value

  for (let i = 0; i < input.times; i++) {
    value = await context.local.add({ input: { a: value, b: 1 } })
  }

  return value
}

exports.computation = computation
