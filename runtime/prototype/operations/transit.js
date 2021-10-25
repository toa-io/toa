'use strict'

async function transit (input, entity) {
  Object.assign(entity, input)

  return { output: { id: entity.id } }
}

exports.transition = transit
