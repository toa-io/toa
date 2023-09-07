'use strict'

async function transit (input, object) {
  Object.assign(object, input)

  return { id: object.id }
}

exports.transition = transit
