'use strict'

const { generate } = require('randomstring')

const operation = { observation: jest.fn(async () => generate()) }
const context = { [generate()]: generate() }

exports.operation = operation
exports.context = context
