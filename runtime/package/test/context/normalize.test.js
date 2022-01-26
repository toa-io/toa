'use strict'

const clone = require('clone-deep')

const fixtures = require('./fixtures')
const { normalize } = require('../../src/context/normalize')

let context

beforeEach(() => {
  context = clone(fixtures.context)
})

it('should resolve version', () => {
  context.runtime = '.'

  normalize(context)

  expect(context.runtime).not.toEqual('.')
  expect(context.runtime).toEqual(require('@toa.io/runtime').version)
})
