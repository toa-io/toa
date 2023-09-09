'use strict'

async function transition (input, object) {
  Object.assign(object, input)

  return { id: object.id, ok: 'ok' }
}

exports.transition = transition
