'use strict'

async function deduce (input, entry) {
  if (entry.balance < input) return { error: { code: 1, message: 'not enough credits' } }

  entry.balance -= input

  return { output: entry.balance }
}

exports.transition = deduce
