'use strict'

function computation (input) {
  return NOPE
}

const NOPE = Object.create(Error.prototype, {
  code: { value: 'NOPE' },
  message: { value: 'declined on purpose', enumerable: true }
})

exports.computation = computation
