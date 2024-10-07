'use strict'

function transition (input, object) {
  if (input.name === 'return_error') {
    const e = new Error()

    e.code = 0

    return e
  }

  return Object.assign(object, input)
}

exports.transition = transition
