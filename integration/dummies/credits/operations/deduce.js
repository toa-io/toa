'use strict'

async function transition (input, entry) {
  if (entry.balance < input) return [null, { code: 1, message: 'not enough credits' }]

  entry.balance -= input

  return { output: entry.balance }
}

exports.transition = transition
