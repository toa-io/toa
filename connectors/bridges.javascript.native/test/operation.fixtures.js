'use strict'

const { generate } = require('randomstring')

const parse = jest.fn(() => ({ [generate()]: generate() }))
const context = { [generate()]: generate() }

exports.mock = { parse }
exports.context = context
