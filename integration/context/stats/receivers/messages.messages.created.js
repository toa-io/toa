'use strict'

exports.request = (payload) => ({
  input: { messages: true },
  query: { id: payload.sender }
})
