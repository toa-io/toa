'use strict'

async function deduce (input, object) {
  if (object.balance < input) return { error: { code: 1, message: 'not enough credits' } }

  object.balance -= input

  return object.balance
}

exports.transition = deduce
