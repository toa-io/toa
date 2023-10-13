'use strict'

async function computation (input, context) {
  const numbers = await context.remote.streams.numbers.generate({ input })

  let sum = 0

  for await (const number of numbers) sum += number

  return sum
}

exports.computation = computation
