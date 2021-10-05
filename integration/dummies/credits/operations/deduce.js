'use strict'

async function transition (input, entry) {
  if (entry.balance < input) return [null, { code: 1, message: 'not enough credits' }]

  entry.balance = entry.balance - input

  return [entry.balance]
}

module.exports = transition
