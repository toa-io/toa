'use strict'

const request = async (payload) => ({
  input: { booked: true },
  query: { id: payload.id }
})

exports.request = request
