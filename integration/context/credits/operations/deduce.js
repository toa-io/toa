'use strict'

async function deduce (input, object) {
  if (object.balance < input)
    return ERR_NOT_ENOUGH_CREDITS

  object.balance -= input

  return object.balance
}

const ERR_NOT_ENOUGH_CREDITS = new Error('NOT_ENOUGH_CREDITS')

exports.transition = deduce
