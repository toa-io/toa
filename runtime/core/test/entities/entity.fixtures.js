'use strict'

const { generate } = require('randomstring')

// noinspection JSCheckFunctionSignatures
const schema = {
  fit: jest.fn((object) =>
    (object.fail ? { [generate()]: generate() } : null)),

  defaults: jest.fn(() => ({ [generate()]: generate() }))
}

const state = () => ({
  id: generate(),
  foo: generate(),
  _created: generate(),
  _updated: generate(),
  _deleted: generate(),
  _version: 0
})

const failed = () => ({
  ...state(),
  fail: true
})

exports.schema = schema
exports.state = state
exports.failed = failed
