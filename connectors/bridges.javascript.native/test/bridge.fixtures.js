'use strict'

const randomstring = require('randomstring')

const parse = jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() }))

exports.mock = { parse }
