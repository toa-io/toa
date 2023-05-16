'use strict'

async function computation (input, context) {
  const greetings = context.configuration.greetings
  const greeting = greetings[input]
  const { a, b } = greeting
  const output = `${a} ${b}`

  return { output }
}

exports.computation = computation
