'use strict'

const { generate } = require('randomstring')

const aspect = {
  invoke: jest.fn(async () => generate)
}

exports.aspect = aspect
