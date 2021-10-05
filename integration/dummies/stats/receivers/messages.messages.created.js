'use strict'

const request = (payload) => ({
  input: { messages: true },
  query: { id: payload.sender }
})

exports.request = request
