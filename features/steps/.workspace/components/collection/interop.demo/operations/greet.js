'use strict'

async function computation (input, context) {
  const greeting = GREETINGS[input.language]

  const sentence = await context.local.format({
    input: {
      name: input.name,
      greeting
    }
  })

  return sentence
}

const GREETINGS = {
  'en': 'Hello',
  'fr': 'Bonjour'
}

exports.computation = computation
