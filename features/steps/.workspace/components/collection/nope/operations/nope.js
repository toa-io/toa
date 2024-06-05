'use strict'

function computation () {
  return ERR
}

const ERR = Object.create(Error.prototype, {
  code: { value: Math.random() > 0.5 ? 'SOMETHING' : 'SOMETHING_ELSE' },
  message: { value: 'ERR', enumerable: true }
})

exports.computation = computation
