'use strict'

async function transit (input, object) {
  Object.assign(object, input)

  return object
}

exports.transition = transit
