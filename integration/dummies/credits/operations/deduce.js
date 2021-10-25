'use strict'

async function deduce (input, entity) {
  if (entity.balance < input) return { error: { code: 1, message: 'not enough credits' } }

  entity.balance -= input

  return { output: entity.balance }
}

exports.transition = deduce
