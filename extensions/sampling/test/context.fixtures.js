'use strict'

const { generate } = require('randomstring')

const context = /** @type {jest.MockedObject<Partial<toa.core.Context>>} */ {
  annexes: [generate(), generate()],
  apply: jest.fn(async () => generate()),
  call: jest.fn(async () => generate()),
  link: jest.fn()
}

exports.context = context
