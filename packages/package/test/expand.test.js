'use strict'

const clone = require('clone-deep')

const { expand } = require('../src/expand')
const fixtures = require('./expamd.fixtures')

let source

beforeEach(() => {
  source = clone(fixtures.source)
})

it('should expand', () => {
  expand(source)
  expect(source).toStrictEqual(fixtures.target)
})
