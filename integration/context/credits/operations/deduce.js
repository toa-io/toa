'use strict'

const { Nope } = require('nopeable')

async function deduce (input, object) {
  if (object.balance < input) return new Nope(1, 'Not enough credits')

  object.balance -= input

  return object.balance
}

exports.transition = deduce
