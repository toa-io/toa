'use strict'

const { generate } = require('randomstring')

const binding = (index) => ({
  request: jest.fn(async (request) => {
    if (request?.pick !== undefined && request.pick !== index) return false

    return { output: generate() }
  })
})

const bindings = [0, 1, 2, 3, 4].map(binding)

exports.bindings = bindings
