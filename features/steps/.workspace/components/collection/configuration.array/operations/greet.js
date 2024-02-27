'use strict'

async function computation (input, context) {
  const {
    a,
    b
  } = context.configuration.greetings[input]

  return `${a} ${b}`
}

exports.computation = computation
