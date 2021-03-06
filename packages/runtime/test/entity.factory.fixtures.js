'use strict'

const randomstring = require('randomstring')

const schema = {
  fit: jest.fn(value => !value.invalid),
  proxy: jest.fn(value => ({ ...value, _proxied: randomstring.generate() })),
  defaults: jest.fn(() => ({ foo: randomstring.generate() }))
}

const identify = jest.fn(() => randomstring.generate())

const value = {
  _id: randomstring.generate(),
  foo: randomstring.generate()
}

const invalid = { invalid: true }

const mock = {
  entity: {
    Entity: jest.fn().mockImplementation((value) =>
      Object.assign({ _entity: randomstring.generate() }, value))
  }
}

exports.schema = schema
exports.identify = identify
exports.value = value
exports.invalid = invalid
exports.mock = mock
