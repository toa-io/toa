'use strict'

const { generate } = require('randomstring')

const context = /** @type {jest.MockedObject<Partial<toa.core.Context>>} */ {
  annexes: [],
  apply: jest.fn(async () => generate()),
  call: jest.fn(async () => generate())
}

exports.context = context
