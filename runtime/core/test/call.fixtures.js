'use strict'

const { generate } = require('randomstring')

// noinspection JSCheckFunctionSignatures
const transmission = {
  request: jest.fn((request) => ({ [request.invalid ? 'exception' : generate()]: generate() }))
}

const contract = {
  fit: jest.fn(() => null)
}

const request = () => ({
  ok: {
    input: { [generate()]: generate() },
    query: { [generate()]: generate() }
  },
  bad: {
    invalid: true
  }
})

exports.transmission = transmission
exports.contract = contract
exports.request = request
