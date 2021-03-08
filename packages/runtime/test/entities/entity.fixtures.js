'use strict'

const randomstring = require('randomstring')

const value = {
  _id: randomstring.generate(),
  foo: randomstring.generate(),
  bar: randomstring.generate()
}

const identify = jest.fn(() => randomstring.generate())

exports.value = value
exports.identify = identify
