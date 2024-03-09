'use strict'

function transit (input, object) {
  return Object.assign(object, input)
}

exports.transition = transit
