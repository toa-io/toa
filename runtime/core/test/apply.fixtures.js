'use strict'

const { generate } = require('randomstring')

const runtime = {
  invoke: jest.fn()
}

const contract = {
  fit: jest.fn()
}

const endpoint = generate()

exports.runtime = runtime
exports.contract = contract
exports.endpoint = endpoint
