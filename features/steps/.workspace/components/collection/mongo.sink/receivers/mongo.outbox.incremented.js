'use strict'

exports.request = (payload) => {
  return {
    input: { inc: payload.inc },
    query: { id: payload.id }
  }
}
