'use strict'

const { generate } = require('randomstring')
const mock = { uris: { construct: () => generate() }, Pointer: class {} }

jest.mock('@toa.io/pointer', () => mock)
const { annotation } = require('../src')

it('should export annotations', () => {
  expect(annotation).toBeDefined()
})

it('should export connectors.uris construct', () => {
  expect(annotation).toStrictEqual(mock.uris.construct)
})
