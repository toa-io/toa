'use strict'

const randomstring = require('randomstring')

const schema = {
  fit: jest.fn((object) => ({ ok: !object.fail, oh: object.fail && { message: 'oops' } }))
}

const object = {
  id: randomstring.generate(),
  foo: randomstring.generate(),
  _created: randomstring.generate(),
  _updated: randomstring.generate(),
  _deleted: randomstring.generate(),
  _version: randomstring.generate()
}

exports.schema = schema
exports.object = object
exports.id = randomstring.generate()
