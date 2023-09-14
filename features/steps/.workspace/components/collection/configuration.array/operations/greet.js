'use strict'

async function computation (input, context) {
  const greetings = context.configuration.greetings
  const greeting = greetings[input]
  const { a, b } = greeting

  return `${a} ${b}`
}

exports.computation = computation
