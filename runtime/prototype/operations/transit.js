'use strict'

async function transit (input, object) {
  Object.assign(object, input)

  return { output: { id: object.id } }
}

exports.transition = transit
