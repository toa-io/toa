'use strict'

const { generate } = require('randomstring')

const suite = {
  components: jest.fn(async () => generate())
}

exports.suite = suite
