'use strict'

const request = async (payload) => ({
  input: { booked: true },
  query: { id: payload.pot }
})

exports.request = request
