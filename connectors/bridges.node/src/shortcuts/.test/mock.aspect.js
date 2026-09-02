'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

const aspect = {
  invoke: mock.fn(async () => generate)
}

exports.aspect = aspect
