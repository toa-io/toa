'use strict'

function computation () {
  return ERR
}

const ERR = Object.create(Error.prototype, {
  message: { value: 'ERR', enumerable: true }
})

exports.computation = computation
