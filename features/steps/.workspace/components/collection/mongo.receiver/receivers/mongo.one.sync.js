'use strict'

exports.request = (payload) => {
  return {
    query: { id: payload.id }
  }
}
