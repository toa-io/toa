'use strict'

const { generate } = require('randomstring')
const mock = { uris: { construct: () => generate() } }

jest.mock('@toa.io/libraries/connectors', () => mock)
const { annotation } = require('../')

it('should export annotations', () => {
  expect(annotation).toBeDefined()
})

it('should export connectors.uris construct', () => {
  expect(annotation).toStrictEqual(mock.uris.construct)
})
