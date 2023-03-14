'use strict'

const { generate } = require('randomstring')

const name = jest.fn(() => generate())

exports.name = name
