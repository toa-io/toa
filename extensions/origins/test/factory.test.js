'use strict'

const { Context } = require('../src/context')
const { Locator } = require('@toa.io/core')

const fixtures = require('./factory.fixtures')
const { Factory } = require('../src')

/** @type {toa.core.extensions.Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

it('should create context extension', () => {
  const extension = factory.context(new Locator(), fixtures.declaration)

  expect(extension).toBeInstanceOf(Context)
})
