'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

// noinspection JSCheckFunctionSignatures
const transmission = {
  request: mock.fn((request) => ({ [request.invalid ? 'exception' : 'output']: generate() })),
  link: mock.fn()
}

const contract = {
  fit: mock.fn(() => null)
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
