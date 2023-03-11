'use strict'

exports.request = (payload) => ({
  input: { title: payload.text },
  query: { id: payload.sender }
})
