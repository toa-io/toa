'use strict'

function transition (input, object) {
  object.counted++

  return object
}

exports.transition = transition
