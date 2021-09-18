'use strict'

const { generate } = require('randomstring')

const declaration = { name: generate() }

const binding = (index) => ({
  request: jest.fn(async (name, request) => {
    if (request?.pick !== undefined && request.pick !== index) return false

    return { output: generate() }
  })
})

const bindings = [0, 1, 2, 3, 4].map(binding)

exports.declaration = declaration
exports.bindings = bindings
