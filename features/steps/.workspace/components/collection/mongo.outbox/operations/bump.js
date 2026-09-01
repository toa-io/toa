'use strict'

function transition (input, object) {
  object.foo += input.inc
  object._trailers.inc = input.inc

  return object
}

exports.transition = transition
