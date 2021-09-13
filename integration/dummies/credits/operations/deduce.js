'use strict'

async function transition (input, entry) {
  // if (entry.balance < input.amount) return [null, { code: 1, message: 'not enough credits' }]
  //
  // entry.balance = entry.balance - input.amount
  //
  // return [entry.balance]
  return [Math.round(Math.random() * 100)]
}

module.exports = transition
