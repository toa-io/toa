'use strict'

function transition (input, object) {
  object.foo = input.foo

  return object
}

exports.transition = transition
