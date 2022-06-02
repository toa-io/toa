'use strict'

const { generate } = require('randomstring')
const clone = require('clone-deep')

// noinspection JSCheckFunctionSignatures
const schema = {
  fit: jest.fn((object) =>
    (object.fail ? { [generate()]: generate() } : null)),

  defaults: jest.fn(() => ({ [generate()]: generate() }))
}

const state = () => clone({
  id: generate(),
  foo: generate(),
  _created: generate(),
  _updated: generate(),
  _deleted: generate(),
  _version: generate()
})

const failed = () => clone({ ...state(), fail: true })

exports.schema = schema
exports.state = state
exports.failed = failed
