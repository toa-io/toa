'use strict'

const { generate } = require('randomstring')

const replay = jest.fn(async () => generate())

exports.replay = { replay }
